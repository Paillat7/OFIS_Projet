from django.shortcuts import render
from django.http import JsonResponse
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import filters
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import models
from django.db.models import Sum
from datetime import datetime, timedelta, date as date_today
from .models import (
    Client, OrdreTravail, DocumentOT, SuiviOT,
    RapportJournalier, LigneRapportJournalier,
    RapportHebdoCadre,
    Projet, HeureProjet, SousService, Technician, Notification,
    Ticket, TicketHistorique
)
from .serializers import (
    ClientSerializer, OrdreTravailSerializer, DocumentOTSerializer,
    SuiviOTSerializer, RapportJournalierSerializer,
    RapportHebdoCadreSerializer,
    UserSerializer, CustomTokenObtainPairSerializer,
    ProjetSerializer, HeureProjetSerializer, TechnicianSerializer, NotificationSerializer,
     TicketSerializer, TicketHistoriqueSerializer
)
from rest_framework_simplejwt.views import TokenObtainPairView


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# ===== CLIENTS =====
class ClientListCreate(generics.ListCreateAPIView):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['firstName', 'lastName', 'company', 'email', 'phone']
    ordering_fields = ['firstName', 'company', 'createdAt']
    ordering = ['firstName']

    def get_queryset(self):
        user = self.request.user
        queryset = Client.objects.all()
        
        if not (user.is_staff or user.is_superuser):
            queryset = queryset.filter(is_active=True)
        
        company = self.request.query_params.get('company')
        if company:
            queryset = queryset.filter(company__icontains=company)
        
        is_active = self.request.query_params.get('is_active')
        if is_active is not None and (user.is_staff or user.is_superuser):
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset


class ClientRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]


# ===== UTILISATEURS =====
class UserListCreate(generics.ListCreateAPIView):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'first_name', 'last_name', 'email']
    ordering_fields = ['username', 'date_joined']
    ordering = ['username']

    def get_queryset(self):
        user = self.request.user
        queryset = User.objects.all()
        
        if not (user.is_staff or user.is_superuser):
            queryset = queryset.filter(is_staff=False, is_superuser=False)
        
        role = self.request.query_params.get('role')
        if role == 'technicien':
            queryset = queryset.filter(is_staff=False, is_superuser=False)
            queryset = queryset.exclude(groups__name='cadre')
        elif role == 'cadre':
            queryset = queryset.filter(groups__name='cadre')
        elif role == 'admin':
            queryset = queryset.filter(is_staff=True) | queryset.filter(is_superuser=True)
        
        return queryset


# ===== PROJETS =====
class ProjetViewSet(viewsets.ModelViewSet):
    queryset = Projet.objects.all()
    serializer_class = ProjetSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nom', 'description']
    ordering_fields = ['date_debut', 'date_fin', 'created_at', 'estimation_heures']
    ordering = ['-date_debut']

    def get_queryset(self):
        user = self.request.user
        queryset = Projet.objects.all()
        
        if not (user.is_staff or user.is_superuser):
            try:
                technician = Technician.objects.get(user=user)
                if technician.sous_services.exists():
                    techniciens = Technician.objects.filter(
                        sous_services__in=technician.sous_services.all()
                    ).distinct()
                    techniciens_ids = [t.user.id for t in techniciens]
                    queryset = queryset.filter(
                        models.Q(chef_projet=user) | 
                        models.Q(intervenants__in=techniciens_ids)
                    ).distinct()
                else:
                    queryset = queryset.filter(intervenants=user)
            except Technician.DoesNotExist:
                queryset = queryset.filter(intervenants=user)
        
        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)
        
        chef_id = self.request.query_params.get('chef_projet')
        if chef_id and (user.is_staff or user.is_superuser):
            queryset = queryset.filter(chef_projet_id=chef_id)
        
        intervenant_id = self.request.query_params.get('intervenant')
        if intervenant_id:
            queryset = queryset.filter(intervenants__id=intervenant_id)
        
        date_debut = self.request.query_params.get('date_debut')
        if date_debut:
            queryset = queryset.filter(date_debut__gte=date_debut)
        
        date_fin = self.request.query_params.get('date_fin')
        if date_fin:
            queryset = queryset.filter(date_fin__lte=date_fin)
        
        return queryset.distinct()

    def perform_create(self, serializer):
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            raise PermissionDenied("Seuls les managers peuvent créer des projets")
        serializer.save()

    @action(detail=True, methods=['post'])
    def ajouter_heures(self, request, pk=None):
        projet = self.get_object()
        
        if projet.chef_projet.id != request.user.id and not request.user.is_staff:
            return Response({'error': 'Seul le chef de projet peut ajouter des heures'}, status=403)
        
        intervenant_id = request.data.get('intervenant')
        date = request.data.get('date')
        heures = request.data.get('heures')
        description = request.data.get('description', '')
        heure_debut = request.data.get('heure_debut')
        heure_fin = request.data.get('heure_fin')
        
        if not intervenant_id or not date or not heures:
            return Response({'error': 'intervenant, date et heures sont requis'}, status=400)
        
        try:
            intervenant = User.objects.get(id=intervenant_id)
        except User.DoesNotExist:
            return Response({'error': 'Intervenant non trouvé'}, status=404)
        
        heure_projet = HeureProjet.objects.create(
            projet=projet,
            intervenant=intervenant,
            date=date,
            heure_debut=heure_debut,
            heure_fin=heure_fin,
            heures=heures,
            description=description
        )
        
        serializer = HeureProjetSerializer(heure_projet)
        return Response(serializer.data, status=201)

    @action(detail=True, methods=['get'])
    def heures(self, request, pk=None):
        projet = self.get_object()
        heures = projet.heures.all()
        serializer = HeureProjetSerializer(heures, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def ajouter_intervenant(self, request, pk=None):
        projet = self.get_object()
        
        if projet.chef_projet.id != request.user.id and not request.user.is_staff:
            return Response({'error': 'Non autorisé'}, status=403)
        
        intervenant_id = request.data.get('intervenant_id')
        if not intervenant_id:
            return Response({'error': 'intervenant_id requis'}, status=400)
        
        try:
            intervenant = User.objects.get(id=intervenant_id)
            projet.intervenants.add(intervenant)
            return Response({
                'status': 'Intervenant ajouté',
                'intervenants': [u.id for u in projet.intervenants.all()]
            })
        except User.DoesNotExist:
            return Response({'error': 'Intervenant non trouvé'}, status=404)

    @action(detail=True, methods=['post'])
    def retirer_intervenant(self, request, pk=None):
        projet = self.get_object()
        
        if projet.chef_projet.id != request.user.id and not request.user.is_staff:
            return Response({'error': 'Non autorisé'}, status=403)
        
        intervenant_id = request.data.get('intervenant_id')
        if not intervenant_id:
            return Response({'error': 'intervenant_id requis'}, status=400)
        
        projet.intervenants.remove(intervenant_id)
        return Response({
            'status': 'Intervenant retiré',
            'intervenants': [u.id for u in projet.intervenants.all()]
        })

    @action(detail=True, methods=['get'])
    def historique(self, request, pk=None):
        projet = self.get_object()
        historique = []
        
        for heure in projet.heures.all():
            historique.append({
                'type': 'heure',
                'date': heure.date.isoformat(),
                'intervenant': heure.intervenant.username,
                'heures': float(heure.heures),
                'description': heure.description,
                'created_at': heure.created_at.isoformat()
            })
        
        historique.sort(key=lambda x: x['date'], reverse=True)
        return Response(historique)

    @action(detail=True, methods=['get'])
    def verifier_alertes(self, request, pk=None):
        projet = self.get_object()
        
        alertes = []
        heures_consommees = projet.heures_consommees
        estimation = float(projet.estimation_heures)
        cout = float(projet.cout_projet) if projet.cout_projet else 0
        benefice_attendu = float(projet.benefice_attendu) if projet.benefice_attendu else 0
        
        # Récupérer la dernière date de saisie
        derniere_heure = projet.heures.order_by('-date').first()
        
        # 1. Dépassement d'heures (AFFICHER TOUJOURS, même si terminé)
        if heures_consommees > estimation:
            depassement = heures_consommees - estimation
            alertes.append({
                'type': 'depassement_heures',
                'message': f'⚠️ Dépassement de {depassement:.1f} heures sur le projet {projet.nom}',
                'severite': 'warning'
            })
        
        # 2. Dépassement de délai (uniquement si projet non terminé)
        if projet.date_fin and derniere_heure:
            date_fin_prevue = projet.date_fin
            derniere_date_saisie = derniere_heure.date
            
            # Vérifier si le projet est terminé pour les délais
            est_termine = heures_consommees >= estimation
            
            if not est_termine and derniere_date_saisie > date_fin_prevue:
                jours_retard = (derniere_date_saisie - date_fin_prevue).days
                alertes.append({
                    'type': 'depassement_delai',
                    'message': f'⚠️ Retard de {jours_retard} jour(s) sur le projet {projet.nom}',
                    'severite': 'warning'
                })
        
        # 3. Marge critique (<15%) - toujours afficher
        if cout > 0 and benefice_attendu > 0:
            marge_attendue = (benefice_attendu / cout) * 100
            if marge_attendue < 15:
                alertes.append({
                    'type': 'marge_critique',
                    'message': f'🔴 Marge projet à {marge_attendue:.1f}% (seuil critique 15%) - Projet non rentable!',
                    'severite': 'critical'
                })
        
        return Response(alertes)
    
    @action(detail=True, methods=['get'])
    def impact_retard(self, request, pk=None):
        projet = self.get_object()
        
        if not projet.date_fin:
            return Response({'impact': None, 'message': 'Pas de date de fin définie'})
        
        # Récupérer la dernière date de saisie d'heures
        derniere_heure = projet.heures.order_by('-date').first()
        
        if not derniere_heure:
            return Response({'impact': None, 'message': 'Aucune heure saisie'})
        
        # Vérifier si le projet est terminé
        heures_consommees = projet.heures_consommees
        estimation = float(projet.estimation_heures)
        est_termine = heures_consommees >= estimation
        
        # Si projet terminé, pas d'impact retard
        if est_termine:
            return Response({'impact': None, 'message': 'Projet terminé'})
        
        date_fin_prevue = projet.date_fin
        derniere_date_saisie = derniere_heure.date
        
        if derniere_date_saisie <= date_fin_prevue:
            return Response({'impact': None, 'message': 'Pas de retard'})
        
        jours_retard = (derniere_date_saisie - date_fin_prevue).days
        cout = float(projet.cout_projet) if projet.cout_projet else 0
        benefice_attendu = float(projet.benefice_attendu) if projet.benefice_attendu else 0
        
        if cout == 0 or benefice_attendu == 0:
            return Response({'impact': None, 'message': 'Données financières manquantes'})
        
        marge_attendue = (benefice_attendu / cout) * 100
        penalite_par_jour = 1.0
        perte_marge = min(jours_retard * penalite_par_jour, marge_attendue)
        nouveau_benefice = benefice_attendu * (1 - perte_marge / 100)
        nouvelle_marge = marge_attendue - perte_marge
        
        return Response({
            'jours_retard': jours_retard,
            'perte_marge': round(perte_marge, 1),
            'marge_attendue': round(marge_attendue, 1),
            'nouveau_benefice': round(nouveau_benefice, 0),
            'nouvelle_marge': round(nouvelle_marge, 1),
            'est_critique': nouvelle_marge < 15
        })


# ===== ORDRES DE TRAVAIL =====
class OrdreTravailViewSet(viewsets.ModelViewSet):
    queryset = OrdreTravail.objects.all()
    serializer_class = OrdreTravailSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['reference', 'objet', 'reference_externe', 'client_rapport__company']
    ordering_fields = ['date_creation', 'date_debut', 'date_fin', 'reference']
    ordering = ['-date_creation']

    def get_queryset(self):
        user = self.request.user
        queryset = OrdreTravail.objects.all()
        
        if not (user.is_staff or user.is_superuser):
            try:
                technician = Technician.objects.get(user=user)
                if technician.sous_services.exists():
                    techniciens = Technician.objects.filter(
                        sous_services__in=technician.sous_services.all()
                    ).distinct()
                    techniciens_ids = [t.user.id for t in techniciens]
                    queryset = queryset.filter(techniciens__in=techniciens_ids).distinct()
                else:
                    queryset = queryset.filter(techniciens=user)
            except Technician.DoesNotExist:
                queryset = queryset.filter(techniciens=user)
        
        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)
        
        validation = self.request.query_params.get('validation')
        if validation:
            queryset = queryset.filter(statut_validation=validation)
        
        client_id = self.request.query_params.get('client')
        if client_id:
            queryset = queryset.filter(client_rapport_id=client_id)
        
        technicien_id = self.request.query_params.get('technicien')
        if technicien_id:
            queryset = queryset.filter(techniciens__id=technicien_id)
        
        date_debut = self.request.query_params.get('date_debut')
        if date_debut:
            queryset = queryset.filter(date_creation__date__gte=date_debut)
        
        date_fin = self.request.query_params.get('date_fin')
        if date_fin:
            queryset = queryset.filter(date_creation__date__lte=date_fin)
        
        return queryset.distinct()

    @action(detail=True, methods=['post'])
    def demarrer(self, request, pk=None):
        ot = self.get_object()
        if ot.statut != 'planifie':
            return Response({'error': 'Cet OT ne peut pas être démarré'}, status=400)
        ot.statut = 'en_cours'
        ot.date_debut = timezone.now()
        ot.save()
        return Response({'status': 'OT démarré', 'ot': self.get_serializer(ot).data})

    @action(detail=True, methods=['post'])
    def terminer(self, request, pk=None):
        ot = self.get_object()
        if ot.statut != 'en_cours':
            return Response({'error': 'Seul un OT en cours peut être terminé'}, status=400)
        ot.statut = 'termine'
        ot.date_fin = timezone.now()
        ot.statut_validation = 'en_attente'
        ot.save()
        return Response({'status': 'OT terminé', 'ot': self.get_serializer(ot).data})

    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        ot = self.get_object()
        if not request.user.is_staff:
            return Response({'error': 'Non autorisé'}, status=403)
        if ot.statut != 'termine':
            return Response({'error': 'Seul un OT terminé peut être validé'}, status=400)
        ot.statut_validation = 'valide'
        ot.valide_par = request.user
        ot.date_validation = timezone.now()
        ot.date_archivage = timezone.now()
        ot.save()
        return Response({'status': 'OT validé et archivé'})

    @action(detail=True, methods=['post'])
    def rejeter(self, request, pk=None):
        ot = self.get_object()
        if not request.user.is_staff:
            return Response({'error': 'Non autorisé'}, status=403)
        if ot.statut != 'termine':
            return Response({'error': 'Seul un OT terminé peut être rejeté'}, status=400)
        ot.statut_validation = 'rejete'
        ot.save()
        return Response({'status': 'OT rejeté'})

    @action(detail=True, methods=['post'])
    def ajouter_technicien(self, request, pk=None):
        ot = self.get_object()
        technicien_id = request.data.get('technicien_id')
        if not technicien_id:
            return Response({'error': 'technicien_id requis'}, status=400)
        try:
            technicien = User.objects.get(id=technicien_id)
            ot.techniciens.add(technicien)
            ot.save()
            return Response({'status': 'Technicien ajouté', 'techniciens': [t.id for t in ot.techniciens.all()]})
        except User.DoesNotExist:
            return Response({'error': 'Technicien non trouvé'}, status=404)

    @action(detail=True, methods=['post'])
    def retirer_technicien(self, request, pk=None):
        ot = self.get_object()
        technicien_id = request.data.get('technicien_id')
        if not technicien_id:
            return Response({'error': 'technicien_id requis'}, status=400)
        ot.techniciens.remove(technicien_id)
        return Response({'status': 'Technicien retiré', 'techniciens': [t.id for t in ot.techniciens.all()]})

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_document(self, request, pk=None):
        ot = self.get_object()
        
        is_technicien = request.user in ot.techniciens.all()
        is_assistant = request.user.groups.filter(name='assistant').exists()
        
        if not (request.user.is_staff or is_technicien or is_assistant):
            return Response({'error': 'Non autorisé'}, status=403)
        
        type_doc = request.data.get('type')
        fichier = request.FILES.get('fichier')
        
        if not type_doc or not fichier:
            return Response({'error': 'Type et fichier requis'}, status=400)
        
        document = DocumentOT.objects.create(
            ot=ot,
            type=type_doc,
            fichier=fichier,
            nom=fichier.name
        )
        serializer = DocumentOTSerializer(document, context={'request': request})
        return Response(serializer.data, status=201)

    @action(detail=True, methods=['get'])
    def historique(self, request, pk=None):
        ot = self.get_object()
        historique = []
        
        for suivi in ot.suivis.all():
            historique.append({
                'type': 'suivi',
                'date': suivi.date.isoformat(),
                'technicien': suivi.technicien.username,
                'heures': float(suivi.heures),
                'description': suivi.description,
                'created_at': suivi.created_at.isoformat()
            })
        
        for doc in ot.documents.all():
            historique.append({
                'type': doc.type,
                'date': doc.uploaded_at.date().isoformat(),
                'nom': doc.nom,
                'fichier_url': doc.fichier.url if doc.fichier else None,
                'uploaded_at': doc.uploaded_at.isoformat()
            })
        
        historique.sort(key=lambda x: x['date'], reverse=True)
        return Response(historique)

    @action(detail=True, methods=['get'])
    def timeline(self, request, pk=None):
        ot = self.get_object()
        
        timeline_data = []
        
        for suivi in ot.suivis.all().order_by('-date'):
            timeline_data.append({
                'id': suivi.id,
                'date': suivi.date,
                'technicien': suivi.technicien.username,
                'technicien_id': suivi.technicien.id,
                'nature': 'Suivi d\'heures',
                'description': suivi.description or 'Aucune description',
                'duree': float(suivi.heures),
                'avancement': None,
                'rit_signe': False,
                'pv_signe': False,
                'date_debut': None,
                'date_fin': None,
                'documents': []
            })
        
        rapports = RapportJournalier.objects.filter(
            lignes__ot=ot
        ).distinct().order_by('date')
        
        for rapport in rapports:
            for ligne in rapport.lignes.filter(ot=ot):
                documents = DocumentOT.objects.filter(
                    ot=ot,
                    uploaded_at__date=rapport.date
                )
                
                timeline_data.append({
                    'id': ligne.id,
                    'date': rapport.date,
                    'technicien': rapport.technicien.username,
                    'technicien_id': rapport.technicien.id,
                    'nature': ligne.nature_intervention,
                    'description': ligne.description,
                    'duree': float(ligne.duree),
                    'avancement': ligne.avancement_resultat,
                    'rit_signe': ligne.rit_signe,
                    'pv_signe': ligne.pv_signe,
                    'date_debut': ligne.date_debut,
                    'date_fin': ligne.date_fin,
                    'documents': [
                        {
                            'id': doc.id,
                            'type': doc.type,
                            'nom': doc.nom,
                            'fichier_url': doc.fichier.url if doc.fichier else None
                        }
                        for doc in documents
                    ]
                })
        
        timeline_data.sort(key=lambda x: x['date'])
        return Response(timeline_data)


# ===== RAPPORTS JOURNALIERS =====
class RapportJournalierViewSet(viewsets.ModelViewSet):
    queryset = RapportJournalier.objects.all()
    serializer_class = RapportJournalierSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['lignes__client__company', 'lignes__nature_intervention', 'lignes__description']
    ordering_fields = ['date']
    ordering = ['-date']

    def get_queryset(self):
        user = self.request.user
        queryset = RapportJournalier.objects.all()
        
        if not (user.is_staff or user.is_superuser):
            try:
                technician = Technician.objects.get(user=user)
                if technician.sous_services.exists():
                    techniciens = Technician.objects.filter(
                        sous_services__in=technician.sous_services.all()
                    ).distinct()
                    techniciens_ids = [t.user.id for t in techniciens]
                    queryset = queryset.filter(technicien__in=techniciens_ids)
                else:
                    queryset = queryset.filter(technicien=user)
            except Technician.DoesNotExist:
                queryset = queryset.filter(technicien=user)
        
        return queryset.distinct()

    def perform_create(self, serializer):
        if self.request.user.is_staff or self.request.user.is_superuser:
            raise PermissionDenied("Un administrateur ne peut pas créer de rapport journalier")
        serializer.save(technicien=self.request.user)


# ===== RAPPORTS HEBDOMADAIRES CADRE =====
class RapportHebdoCadreViewSet(viewsets.ModelViewSet):
    queryset = RapportHebdoCadre.objects.all()
    serializer_class = RapportHebdoCadreSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['resume', 'actions_notables']
    ordering_fields = ['date_debut', 'created_at']
    ordering = ['-date_debut']

    def get_queryset(self):
        user = self.request.user
        queryset = RapportHebdoCadre.objects.all()
        
        if not (user.is_staff or user.is_superuser):
            queryset = queryset.filter(cadre=user)
        
        type_rapport = self.request.query_params.get('type')
        if type_rapport:
            queryset = queryset.filter(type=type_rapport)
        
        cadre_id = self.request.query_params.get('cadre')
        if cadre_id and (user.is_staff or user.is_superuser):
            queryset = queryset.filter(cadre_id=cadre_id)
        
        date_debut = self.request.query_params.get('date_debut')
        if date_debut:
            queryset = queryset.filter(date_debut__gte=date_debut)
        
        date_fin = self.request.query_params.get('date_fin')
        if date_fin:
            queryset = queryset.filter(date_fin__lte=date_fin)
        
        return queryset.distinct()

    def perform_create(self, serializer):
        user = self.request.user
        date_debut = serializer.validated_data.get('date_debut')
        date_fin = serializer.validated_data.get('date_fin')
        
        nb_interventions = 0
        heures_total = 0
        
        try:
            technician = Technician.objects.get(user=user)
            if technician.sous_services.exists():
                techniciens = Technician.objects.filter(
                    sous_services__in=technician.sous_services.all()
                ).distinct()
                techniciens_ids = [t.user.id for t in techniciens]
                
                rapports = RapportJournalier.objects.filter(
                    technicien__in=techniciens_ids,
                    date__gte=date_debut,
                    date__lte=date_fin
                )
                nb_interventions = rapports.count()
                
                for rapport in rapports:
                    for ligne in rapport.lignes.all():
                        heures_total += float(ligne.duree)
        except Technician.DoesNotExist:
            pass
        
        serializer.save(
            cadre=user,
            nb_interventions=nb_interventions,
            heures_total=heures_total
        )


# ===== SUIVI OT =====
class SuiviOTViewSet(viewsets.ModelViewSet):
    queryset = SuiviOT.objects.all()
    serializer_class = SuiviOTSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['date']
    ordering = ['-date']

    def get_queryset(self):
        user = self.request.user
        queryset = SuiviOT.objects.all()
        
        if not (user.is_staff or user.is_superuser):
            queryset = queryset.filter(technicien=user)
        
        ot_id = self.request.query_params.get('ot')
        if ot_id:
            queryset = queryset.filter(ot_id=ot_id)
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(technicien=self.request.user)


# ===== DOCUMENTS OT =====
class DocumentOTViewSet(viewsets.ModelViewSet):
    queryset = DocumentOT.objects.all()
    serializer_class = DocumentOTSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['uploaded_at']
    ordering = ['-uploaded_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return DocumentOT.objects.all()
        return DocumentOT.objects.filter(ot__techniciens=user)

    def perform_create(self, serializer):
        user = self.request.user
        ot = serializer.validated_data.get('ot')
        
        is_technicien = user in ot.techniciens.all()
        is_assistant = user.groups.filter(name='assistant').exists()
        
        if not (user.is_staff or is_technicien or is_assistant):
            raise PermissionDenied("Vous n'êtes pas autorisé à ajouter des documents")
        
        serializer.save()


# ===== TECHNICIENS =====
class TechnicianViewSet(viewsets.ModelViewSet):
    queryset = Technician.objects.all()
    serializer_class = TechnicianSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'phone']
    ordering_fields = ['user__username', 'hire_date', 'taux_horaire']
    ordering = ['user__username']


# ===== NOTIFICATIONS =====
class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return Notification.objects.all()
        return Notification.objects.filter(projet__intervenants=user)

    @action(detail=True, methods=['post'])
    def marquer_lue(self, request, pk=None):
        notification = self.get_object()
        notification.est_lue = True
        notification.save()
        return Response({'status': 'Notification marquée comme lue'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        user = request.user
        if user.is_staff or user.is_superuser:
            count = Notification.objects.filter(est_lue=False).count()
        else:
            count = Notification.objects.filter(projet__intervenants=user, est_lue=False).count()
        return Response({'unread_count': count})


# ===== DASHBOARD =====
class DashboardStatsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        is_staff = user.is_staff or user.is_superuser

        ots = OrdreTravail.objects.all()
        if not is_staff:
            try:
                technician = Technician.objects.get(user=user)
                if technician.sous_services.exists():
                    techniciens = Technician.objects.filter(
                        sous_services__in=technician.sous_services.all()
                    ).distinct()
                    techniciens_ids = [t.user.id for t in techniciens]
                    ots = ots.filter(techniciens__in=techniciens_ids)
                else:
                    ots = ots.filter(techniciens=user)
            except Technician.DoesNotExist:
                ots = ots.filter(techniciens=user)

        ot_counts = {
            'planifie': ots.filter(statut='planifie').count(),
            'en_cours': ots.filter(statut='en_cours').count(),
            'a_valider': ots.filter(statut='termine', statut_validation='en_attente').count(),
            'valide': ots.filter(statut_validation='valide').count(),
            'rejete': ots.filter(statut_validation='rejete').count(),
        }

        rapports = RapportJournalier.objects.all()
        if not is_staff:
            try:
                technician = Technician.objects.get(user=user)
                if technician.sous_services.exists():
                    techniciens_ids = [t.user.id for t in Technician.objects.filter(
                        sous_services__in=technician.sous_services.all()
                    ).distinct()]
                    rapports = rapports.filter(technicien__in=techniciens_ids)
                else:
                    rapports = rapports.filter(technicien=user)
            except Technician.DoesNotExist:
                rapports = rapports.filter(technicien=user)
        
        total_heures = 0
        for rapport in rapports:
            for ligne in rapport.lignes.all():
                total_heures += float(ligne.duree)

        suivis = SuiviOT.objects.all()
        if not is_staff:
            try:
                technician = Technician.objects.get(user=user)
                if technician.sous_services.exists():
                    techniciens_ids = [t.user.id for t in Technician.objects.filter(
                        sous_services__in=technician.sous_services.all()
                    ).distinct()]
                    suivis = suivis.filter(technicien__in=techniciens_ids)
                else:
                    suivis = suivis.filter(technicien=user)
            except Technician.DoesNotExist:
                suivis = suivis.filter(technicien=user)

        for suivi in suivis:
            total_heures += float(suivi.heures)

        total_rapports_journaliers = rapports.count()
        total_rapports_hebdo = RapportHebdoCadre.objects.filter(cadre=user if not is_staff else models.Q()).count()
        total_clients = Client.objects.filter(is_active=True if not is_staff else models.Q()).count()

        heures_par_jour = []
        for i in range(6, -1, -1):
            date = datetime.now().date() - timedelta(days=i)
            date_str = date.strftime('%Y-%m-%d')
            
            heures_jour = 0
            rapports_jour = rapports.filter(date=date_str)
            for rapport in rapports_jour:
                for ligne in rapport.lignes.all():
                    heures_jour += float(ligne.duree)
            suivis_jour = suivis.filter(date=date_str)
            for suivi in suivis_jour:
                heures_jour += float(suivi.heures)
            
            heures_par_jour.append({
                'date': date.strftime('%d/%m'),
                'heures': round(heures_jour, 1)
            })

        heures_par_technicien = []
        techniciens = User.objects.filter(is_staff=False, is_superuser=False)
        
        if not is_staff:
            try:
                technician = Technician.objects.get(user=user)
                if technician.sous_services.exists():
                    techniciens_ids = [t.user.id for t in Technician.objects.filter(
                        sous_services__in=technician.sous_services.all()
                    ).distinct()]
                    techniciens = techniciens.filter(id__in=techniciens_ids)
            except Technician.DoesNotExist:
                pass
        
        for technicien in techniciens:
            total_suivi = SuiviOT.objects.filter(technicien=technicien).aggregate(total=Sum('heures'))['total'] or 0
            total_rapport = 0
            for rapport in RapportJournalier.objects.filter(technicien=technicien):
                for ligne in rapport.lignes.all():
                    total_rapport += float(ligne.duree)
            
            total = float(total_suivi) + total_rapport
            if total > 0:
                heures_par_technicien.append({
                    'nom': technicien.username,
                    'heures': round(total, 1)
                })
        
        heures_par_technicien.sort(key=lambda x: x['heures'], reverse=True)

        repartition_sous_service = []
        for ss in SousService.objects.all():
            total_heures_ss = 0
            techniciens_ss = Technician.objects.filter(sous_services=ss)
            for tech in techniciens_ss:
                for rapport in RapportJournalier.objects.filter(technicien=tech.user):
                    for ligne in rapport.lignes.all():
                        total_heures_ss += float(ligne.duree)
                for suivi in SuiviOT.objects.filter(technicien=tech.user):
                    total_heures_ss += float(suivi.heures)
            
            if total_heures_ss > 0:
                repartition_sous_service.append({
                    'nom': f"{ss.service_parent} - {ss.nom}",
                    'heures': round(total_heures_ss, 1)
                })

        evolution_mensuelle = []
        aujourdhui = datetime.now().date()
        
        for i in range(5, -1, -1):
            mois = aujourdhui.replace(day=1) - timedelta(days=30*i)
            mois_suivant = (mois.replace(day=28) + timedelta(days=4)).replace(day=1)
            
            total_mois = 0
            rapports_mois = RapportJournalier.objects.filter(date__gte=mois, date__lt=mois_suivant)
            suivis_mois = SuiviOT.objects.filter(date__gte=mois, date__lt=mois_suivant)
            
            if not is_staff:
                try:
                    technician = Technician.objects.get(user=user)
                    if technician.sous_services.exists():
                        techniciens_ids = [t.user.id for t in Technician.objects.filter(
                            sous_services__in=technician.sous_services.all()
                        ).distinct()]
                        rapports_mois = rapports_mois.filter(technicien__in=techniciens_ids)
                        suivis_mois = suivis_mois.filter(technicien__in=techniciens_ids)
                except Technician.DoesNotExist:
                    pass
            
            for rapport in rapports_mois:
                for ligne in rapport.lignes.all():
                    total_mois += float(ligne.duree)
            
            for suivi in suivis_mois:
                total_mois += float(suivi.heures)
            
            evolution_mensuelle.append({
                'mois': mois.strftime('%b %Y'),
                'heures': round(total_mois, 1)
            })

        return Response({
            'ot_counts': ot_counts,
            'total_heures': round(total_heures, 1),
            'total_rapports_journaliers': total_rapports_journaliers,
            'total_rapports_hebdo': total_rapports_hebdo,
            'total_clients': total_clients,
            'heures_par_jour': heures_par_jour,
            'heures_par_technicien': heures_par_technicien,
            'repartition_sous_service': repartition_sous_service,
            'evolution_mensuelle': evolution_mensuelle,
        })


# ===== FONCTIONS UTILITAIRES =====
def hello_world(request):
    return JsonResponse({"message": "Hello from OFIS API!"})


from rest_framework.decorators import api_view

@api_view(['POST'])
def test_login(request):
    from django.contrib.auth import authenticate
    from rest_framework_simplejwt.tokens import RefreshToken
    
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'username': user.username,
            'user_id': user.id,
        })
    return Response({'error': 'Invalid credentials'}, status=400)

# ===== TICKETS =====
# ===== TICKETS =====
class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['titre', 'description', 'client__company', 'numero']
    ordering_fields = ['date_creation', 'priorite', 'statut', 'numero']
    ordering = ['-date_creation']
    
    def get_queryset(self):
        user = self.request.user
        queryset = Ticket.objects.all()
        
        # Vérifier les groupes
        is_technicien = user.groups.filter(name='technicien').exists()
        is_manager = user.is_staff or user.is_superuser
        
        # Technicien : ne voit que ses tickets assignés
        if is_technicien and not is_manager:
            queryset = queryset.filter(technicien_assigne=user)
        
        # Filtres
        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)
        
        priorite = self.request.query_params.get('priorite')
        if priorite:
            queryset = queryset.filter(priorite=priorite)
        
        client_id = self.request.query_params.get('client')
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        
        technicien_id = self.request.query_params.get('technicien')
        if technicien_id:
            queryset = queryset.filter(technicien_assigne_id=technicien_id)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(cree_par=self.request.user)
        TicketHistorique.objects.create(
            ticket=serializer.instance,
            utilisateur=self.request.user,
            action='Création du ticket',
            details=f"Ticket créé avec priorité {serializer.instance.get_priorite_display()}"
        )
    
    @action(detail=True, methods=['post'])
    def assigner(self, request, pk=None):
        ticket = self.get_object()
        technicien_id = request.data.get('technicien_id')
        
        if not technicien_id:
            return Response({'error': 'technicien_id requis'}, status=400)
        
        try:
            technicien = User.objects.get(id=technicien_id)
        except User.DoesNotExist:
            return Response({'error': 'Technicien non trouvé'}, status=404)
        
        ancien_technicien = ticket.technicien_assigne
        ticket.technicien_assigne = technicien
        ticket.save()
        
        TicketHistorique.objects.create(
            ticket=ticket,
            utilisateur=request.user,
            action='Assignation',
            details=f"Assigné à {technicien.username} (était {ancien_technicien.username if ancien_technicien else 'non assigné'})"
        )
        
        return Response({'status': 'Technicien assigné'})
    
    @action(detail=True, methods=['post'])
    def changer_statut(self, request, pk=None):
        ticket = self.get_object()
        nouveau_statut = request.data.get('statut')
        
        if nouveau_statut not in ['nouveau', 'en_cours', 'resolu', 'ferme']:
            return Response({'error': 'Statut invalide'}, status=400)
        
        ancien_statut = ticket.statut
        ticket.statut = nouveau_statut
        
        if nouveau_statut == 'resolu' and not ticket.date_resolution:
            ticket.date_resolution = timezone.now()
        elif nouveau_statut == 'ferme' and not ticket.date_fermeture:
            ticket.date_fermeture = timezone.now()
        
        ticket.save()
        
        TicketHistorique.objects.create(
            ticket=ticket,
            utilisateur=request.user,
            action='Changement de statut',
            details=f"Statut changé de {ancien_statut} à {nouveau_statut}"
        )
        
        return Response({'status': 'Statut mis à jour'})
    
    @action(detail=True, methods=['post'])
    def ajouter_temps(self, request, pk=None):
        ticket = self.get_object()
        heures = request.data.get('heures')
        
        if not heures:
            return Response({'error': 'heures requis'}, status=400)
        
        try:
            heures = float(heures)
        except ValueError:
            return Response({'error': 'heures doit être un nombre'}, status=400)
        
        ticket.temps_passe = float(ticket.temps_passe) + heures
        ticket.save()
        
        TicketHistorique.objects.create(
            ticket=ticket,
            utilisateur=request.user,
            action='Ajout de temps',
            details=f"{heures} heures ajoutées (total: {ticket.temps_passe}h)"
        )
        
        return Response({'status': 'Temps ajouté', 'total': ticket.temps_passe})
    
    @action(detail=True, methods=['post'])
    def ajouter_solution(self, request, pk=None):
        ticket = self.get_object()
        solution = request.data.get('solution')
        
        if not solution:
            return Response({'error': 'solution requise'}, status=400)
        
        ticket.solution = solution
        ticket.save()
        
        TicketHistorique.objects.create(
            ticket=ticket,
            utilisateur=request.user,
            action='Solution ajoutée',
            details=solution[:200]
        )
        
        return Response({'status': 'Solution ajoutée'})