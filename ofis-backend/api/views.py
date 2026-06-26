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
    Ticket, TicketHistorique,
    AgendaTechnicien  # ← AJOUTE ICI
)
from .serializers import (
    ClientSerializer, OrdreTravailSerializer, DocumentOTSerializer,
    SuiviOTSerializer, RapportJournalierSerializer,
    RapportHebdoCadreSerializer,
    UserSerializer, CustomTokenObtainPairSerializer,
    ProjetSerializer, HeureProjetSerializer, TechnicianSerializer, NotificationSerializer,
    TicketSerializer, TicketHistoriqueSerializer,
    AgendaTechnicienSerializer  # ← AJOUTE ICI
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
        
        # ===== FILTRAGE POUR LES TECHNICIENS =====
        # Si l'utilisateur n'est ni staff ni superuser, il ne voit que ses OT assignés
        if not (user.is_staff or user.is_superuser):
            # Filtrer par le champ ManyToMany 'techniciens' (OT assignés directement au technicien)
            queryset = queryset.filter(techniciens=user).distinct()
        
        # ===== FILTRES EXISTANTS =====
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
        
        # Si l'utilisateur est staff ou superuser → voit tout
        if user.is_staff or user.is_superuser:
            return queryset
        
        # Vérifier si l'utilisateur est un cadre
        is_cadre = user.groups.filter(name='cadre').exists()
        
        try:
            technician = Technician.objects.get(user=user)
            
            if is_cadre:
                # Un cadre voit les rapports des techniciens de son sous-service
                if technician.sous_services.exists():
                    # Récupérer tous les techniciens du même sous-service
                    techniciens = Technician.objects.filter(
                        sous_services__in=technician.sous_services.all()
                    ).distinct()
                    techniciens_ids = [t.user.id for t in techniciens]
                    queryset = queryset.filter(technicien__in=techniciens_ids)
                else:
                    # Si le cadre n'a pas de sous-service, il ne voit rien
                    queryset = queryset.none()
            else:
                # Un technicien ne voit que ses propres rapports
                queryset = queryset.filter(technicien=user)
                
        except Technician.DoesNotExist:
            # Si l'utilisateur n'a pas de profil Technician, il ne voit rien
            queryset = queryset.none()
        
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
# ===== TECHNICIENS =====
class TechnicianViewSet(viewsets.ModelViewSet):
    queryset = Technician.objects.all()
    serializer_class = TechnicianSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'phone']
    ordering_fields = ['user__username', 'hire_date', 'taux_horaire']
    ordering = ['user__username']

    # ===== DISPONIBILITÉ D'UN TECHNICIEN SPÉCIFIQUE =====
    @action(detail=True, methods=['get', 'patch'])
    def disponibilite(self, request, pk=None):
        technician = self.get_object()
        
        if request.method == 'GET':
            return Response({
                'statut_actuel': technician.statut_actuel,
                'commentaire': technician.commentaire,
                'date_debut': technician.date_debut,
                'date_fin': technician.date_fin,
            })
        
        # PATCH - Mise à jour de la disponibilité
        if not (request.user.is_staff or request.user == technician.user):
            return Response({'error': 'Non autorisé'}, status=403)
        
        statut = request.data.get('statut')
        if statut in ['disponible', 'intervention', 'mission', 'conges']:
            technician.statut_actuel = statut
        if 'commentaire' in request.data:
            technician.commentaire = request.data['commentaire']
        if 'date_debut' in request.data:
            technician.date_debut = request.data['date_debut']
        if 'date_fin' in request.data:
            technician.date_fin = request.data['date_fin']
        
        technician.save()
        return Response({'status': 'Disponibilité mise à jour'})

    # ===== LISTE DES DISPONIBILITÉS DE TOUS LES TECHNICIENS =====
    @action(detail=False, methods=['get'])
    def disponibilites(self, request):
        techniciens = Technician.objects.all()
        data = []
        for tech in techniciens:
            data.append({
                'id': tech.id,
                'username': tech.user.username,
                'first_name': tech.user.first_name,
                'last_name': tech.user.last_name,
                'taux_horaire': tech.taux_horaire,
                'statut_actuel': tech.statut_actuel,
                'commentaire': tech.commentaire,
                'date_debut': tech.date_debut,
                'date_fin': tech.date_fin,
            })
        return Response(data)


# ===== AGENDA TECHNICIEN VIEWSET =====
class AgendaTechnicienViewSet(viewsets.ModelViewSet):
    queryset = AgendaTechnicien.objects.all()
    serializer_class = AgendaTechnicienSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['technicien__user__username', 'commentaire']
    ordering_fields = ['date', 'heure_debut']
    ordering = ['date', 'heure_debut']

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        # Si l'utilisateur n'est pas staff/superuser, il ne voit que son propre agenda
        if not (user.is_staff or user.is_superuser):
            try:
                technician = Technician.objects.get(user=user)
                queryset = queryset.filter(technicien=technician)
            except Technician.DoesNotExist:
                queryset = queryset.none()

        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)
        technicien_id = self.request.query_params.get('technicien')
        if technicien_id:
            queryset = queryset.filter(technicien_id=technicien_id)

        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        technicien = serializer.validated_data.get('technicien')
        # Seul le technicien peut créer son propre agenda
        if not (technicien.user == user):
            raise PermissionDenied("Vous ne pouvez créer un agenda que pour vous-même.")
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()
        technicien = instance.technicien
        # Seul le technicien peut modifier son propre agenda
        if not (technicien.user == user):
            raise PermissionDenied("Vous ne pouvez modifier que votre propre agenda.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        technicien = instance.technicien
        # Seul le technicien peut supprimer son propre agenda
        if not (technicien.user == user):
            raise PermissionDenied("Vous ne pouvez supprimer que votre propre agenda.")
        instance.delete()

    @action(detail=False, methods=['get'])
    def disponibilites_jour(self, request):
        date = request.query_params.get('date')
        if not date:
            return Response({'error': 'Paramètre date requis'}, status=400)

        techniciens = Technician.objects.all()
        disponibles = []

        for tech in techniciens:
            occupe = AgendaTechnicien.objects.filter(
                technicien=tech,
                date=date,
                statut__in=['intervention', 'indisponible', 'conges']
            ).exists()

            if not occupe and tech.statut_actuel != 'conges':
                disponibles.append({
                    'id': tech.id,
                    'username': tech.user.username,
                    'first_name': tech.user.first_name,
                    'last_name': tech.user.last_name,
                    'taux_horaire': tech.taux_horaire,
                })

        return Response(disponibles)


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

        # ===== RÉCUPÉRATION DES SOUS‑SERVICES DE L'UTILISATEUR (IDs) =====
        sous_services_ids = []
        if not is_staff:
            try:
                technician = Technician.objects.get(user=user)
                sous_services_ids = list(technician.sous_services.values_list('id', flat=True))
            except Technician.DoesNotExist:
                pass

        # ===== 1. FILTRAGE DES OT =====
        ots = OrdreTravail.objects.all()
        if not is_staff and sous_services_ids:
            ots = ots.filter(
                techniciens__technician_profile__sous_services__in=sous_services_ids
            ).distinct()
        elif not is_staff:
            ots = ots.filter(techniciens=user)

        # ===== 2. FILTRAGE DES RAPPORTS JOURNALIERS =====
        rapports = RapportJournalier.objects.all()
        if not is_staff and sous_services_ids:
            rapports = rapports.filter(
                technicien__technician_profile__sous_services__in=sous_services_ids
            ).distinct()
        elif not is_staff:
            rapports = rapports.filter(technicien=user)

        # ===== 3. FILTRAGE DES SUIVIS OT =====
        suivis = SuiviOT.objects.all()
        if not is_staff and sous_services_ids:
            suivis = suivis.filter(
                technicien__technician_profile__sous_services__in=sous_services_ids
            ).distinct()
        elif not is_staff:
            suivis = suivis.filter(technicien=user)

        # ===== 4. CALCULS STATISTIQUES =====
        ot_counts = {
            'planifie': ots.filter(statut='planifie').count(),
            'en_cours': ots.filter(statut='en_cours').count(),
            'a_valider': ots.filter(statut='termine', statut_validation='en_attente').count(),
            'valide': ots.filter(statut_validation='valide').count(),
            'rejete': ots.filter(statut_validation='rejete').count(),
        }

        from django.utils import timezone
        ots_dans_les_temps = 0
        ots_en_cours = 0
        ots_en_retard = 0
        for ot in ots:
            if ot.statut == 'termine':
                ots_dans_les_temps += 1
            elif ot.statut == 'en_cours':
                if ot.date_fin and timezone.now().date() > ot.date_fin:
                    ots_en_retard += 1
                else:
                    ots_en_cours += 1
            elif ot.statut == 'planifie':
                if ot.date_fin and timezone.now().date() > ot.date_fin:
                    ots_en_retard += 1
                else:
                    ots_dans_les_temps += 1

        ots_retard_data = []
        for ot in ots:
            if ot.est_en_retard:
                ots_retard_data.append({
                    'id': ot.id,
                    'reference': ot.reference,
                    'objet': ot.objet or 'Sans objet',
                    'client': ot.client_rapport.company or f"{ot.client_rapport.firstName} {ot.client_rapport.lastName}",
                    'date_fin_prevue': ot.date_fin.isoformat() if ot.date_fin else None,
                    'jours_retard': ot.jours_retard,
                    'techniciens': [t.username for t in ot.techniciens.all()],
                })

        total_heures = 0
        for rapport in rapports:
            for ligne in rapport.lignes.all():
                total_heures += float(ligne.duree)
        for suivi in suivis:
            total_heures += float(suivi.heures)

        total_rapports_journaliers = rapports.count()
        total_rapports_hebdo = RapportHebdoCadre.objects.filter(cadre=user if not is_staff else models.Q()).count()
        total_clients = Client.objects.filter(is_active=True if not is_staff else models.Q()).count()

        # Heures par jour
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

        # Heures par technicien (uniquement les techniciens du même sous‑service)
        heures_par_technicien = []
        techniciens = User.objects.filter(is_staff=False, is_superuser=False)
        if not is_staff and sous_services_ids:
            techniciens = techniciens.filter(
                technician_profile__sous_services__in=sous_services_ids
            ).distinct()
        elif not is_staff:
            techniciens = techniciens.filter(id=user.id)

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

        # Répartition par sous‑service
        repartition_sous_service = []
        if is_staff or sous_services_ids:
            ss_queryset = SousService.objects.all()
            if not is_staff:
                ss_queryset = SousService.objects.filter(id__in=sous_services_ids)
            for ss in ss_queryset:
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

        # Évolution mensuelle
        evolution_mensuelle = []
        aujourdhui = datetime.now().date()
        for i in range(5, -1, -1):
            mois = aujourdhui.replace(day=1) - timedelta(days=30*i)
            mois_suivant = (mois.replace(day=28) + timedelta(days=4)).replace(day=1)
            total_mois = 0
            rapports_mois = rapports.filter(date__gte=mois, date__lt=mois_suivant)
            suivis_mois = suivis.filter(date__gte=mois, date__lt=mois_suivant)
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
            'ot_kpi': {
                'dans_les_temps': ots_dans_les_temps,
                'en_cours': ots_en_cours,
                'en_retard': ots_en_retard,
                'total': ots.count(),
            },
            'ots_retard': ots_retard_data,
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

        if not (user.is_staff or user.is_superuser):
            try:
                technician = Technician.objects.get(user=user)
                sous_services_ids = list(technician.sous_services.values_list('id', flat=True))
                if sous_services_ids:
                    queryset = queryset.filter(
                        technicien_assigne__technician_profile__sous_services__in=sous_services_ids
                    ).distinct()
                else:
                    queryset = queryset.filter(technicien_assigne=user)
            except Technician.DoesNotExist:
                queryset = queryset.filter(technicien_assigne=user)

        # Filtres additionnels
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