from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Client, OrdreTravail, DocumentOT, SuiviOT,
    RapportJournalier, LigneRapportJournalier,
    RapportHebdoCadre,
    Projet, HeureProjet, SousService, Technician, Notification,
     Ticket, TicketHistorique
)
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        if user.is_superuser:
            role = 'admin'
        elif user.is_staff:
            role = 'manager'
        else:
            role = 'technicien'
        if user.groups.filter(name='cadre').exists():
            role = 'cadre'
        token['role'] = role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        if user.is_superuser:
            role = 'admin'
        elif user.is_staff:
            role = 'manager'
        else:
            role = 'technicien'
        if user.groups.filter(name='cadre').exists():
            role = 'cadre'
        data['role'] = role
        data['username'] = user.username
        data['user_id'] = user.id
        return data


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'


class OrdreTravailSerializer(serializers.ModelSerializer):
    technicien_username = serializers.CharField(source='technicien.username', read_only=True)
    techniciens_ids = serializers.SerializerMethodField()
    techniciens_names = serializers.SerializerMethodField()
    client_rapport_name = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()
    heures_consommees = serializers.ReadOnlyField()
    avancement = serializers.ReadOnlyField()
    parent_ot_reference = serializers.CharField(source='parent_ot.reference', read_only=True)

    class Meta:
        model = OrdreTravail
        fields = '__all__'
        read_only_fields = ('date_creation', 'date_debut', 'date_fin', 'date_validation', 'valide_par', 'date_archivage')

    def get_techniciens_ids(self, obj):
        return [t.id for t in obj.techniciens.all()]

    def get_techniciens_names(self, obj):
        return [t.username for t in obj.techniciens.all()]

    def get_client_rapport_name(self, obj):
        if obj.client_rapport:
            if obj.client_rapport.company:
                return obj.client_rapport.company
            return f"{obj.client_rapport.firstName} {obj.client_rapport.lastName}"
        return None

    def get_documents(self, obj):
        return DocumentOTSerializer(obj.documents.all(), many=True).data


class DocumentOTSerializer(serializers.ModelSerializer):
    fichier_url = serializers.SerializerMethodField()

    class Meta:
        model = DocumentOT
        fields = ['id', 'type', 'fichier', 'fichier_url', 'nom', 'uploaded_at']

    def get_fichier_url(self, obj):
        if obj.fichier:
            return obj.fichier.url
        return None


class SuiviOTSerializer(serializers.ModelSerializer):
    technicien_name = serializers.CharField(source='technicien.username', read_only=True)

    class Meta:
        model = SuiviOT
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class LigneRapportJournalierSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.company', read_only=True)
    ot_reference = serializers.CharField(source='ot.reference', read_only=True)

    class Meta:
        model = LigneRapportJournalier
        fields = '__all__'
        read_only_fields = ('rapport', 'created_at', 'updated_at')


class RapportJournalierSerializer(serializers.ModelSerializer):
    technicien_name = serializers.CharField(source='technicien.username', read_only=True)
    sous_service_name = serializers.CharField(source='sous_service.nom', read_only=True)
    sous_service_parent = serializers.CharField(source='sous_service.service_parent', read_only=True)
    lignes = LigneRapportJournalierSerializer(many=True, required=False)

    class Meta:
        model = RapportJournalier
        fields = ['id', 'technicien', 'technicien_name', 'date', 'sous_service', 'sous_service_name', 'sous_service_parent', 'lignes', 'created_at', 'updated_at']
        read_only_fields = ('technicien', 'date', 'created_at', 'updated_at')

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes', [])
        rapport = RapportJournalier.objects.create(**validated_data)
        for ligne_data in lignes_data:
            LigneRapportJournalier.objects.create(rapport=rapport, **ligne_data)
        return rapport

    def update(self, instance, validated_data):
        lignes_data = validated_data.pop('lignes', [])
        instance = super().update(instance, validated_data)
        instance.lignes.all().delete()
        for ligne_data in lignes_data:
            LigneRapportJournalier.objects.create(rapport=instance, **ligne_data)
        return instance


class RapportHebdoCadreSerializer(serializers.ModelSerializer):
    cadre_name = serializers.CharField(source='cadre.username', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    sous_service_name = serializers.CharField(source='sous_service.nom', read_only=True)
    sous_service_parent = serializers.CharField(source='sous_service.service_parent', read_only=True)

    class Meta:
        model = RapportHebdoCadre
        fields = ['id', 'cadre', 'cadre_name', 'sous_service', 'sous_service_name', 'sous_service_parent',
                  'date_debut', 'date_fin', 'type', 'type_display', 
                  'resume', 'actions_notables', 'difficultes', 'perspectives', 
                  'nb_interventions', 'heures_total', 'tickets',
                  'created_at', 'updated_at']
        read_only_fields = ('cadre', 'created_at', 'updated_at')


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'is_superuser', 'role']
    
    def get_role(self, obj):
        if obj.is_superuser:
            return 'admin'
        if obj.is_staff:
            return 'manager'
        if obj.groups.filter(name='cadre').exists():
            return 'cadre'
        return 'technicien'


class HeureProjetSerializer(serializers.ModelSerializer):
    intervenant_name = serializers.CharField(source='intervenant.username', read_only=True)

    class Meta:
        model = HeureProjet
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class ProjetSerializer(serializers.ModelSerializer):
    chef_projet_name = serializers.CharField(source='chef_projet.username', read_only=True)
    intervenants_ids = serializers.SerializerMethodField()
    intervenants_names = serializers.SerializerMethodField()
    heures_consommees = serializers.ReadOnlyField()
    heures_restantes = serializers.ReadOnlyField()
    avancement = serializers.ReadOnlyField()
    statut_couleur = serializers.ReadOnlyField()
    devise_cout_display = serializers.CharField(source='get_devise_cout_display', read_only=True)
    devise_benefice_display = serializers.CharField(source='get_devise_benefice_display', read_only=True)
    heures = HeureProjetSerializer(many=True, read_only=True)

    class Meta:
        model = Projet
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def get_intervenants_ids(self, obj):
        return [u.id for u in obj.intervenants.all()]

    def get_intervenants_names(self, obj):
        return [u.username for u in obj.intervenants.all()]


class TechnicianSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Technician
        fields = ['id', 'user_id', 'username', 'first_name', 'last_name', 'email', 
                  'sous_services', 'phone', 'hire_date', 'taux_horaire']


class SousServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SousService
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    projet_name = serializers.CharField(source='projet.nom', read_only=True)
    
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('created_at',)


# ===== TICKETS SERIALIZERS =====
class TicketHistoriqueSerializer(serializers.ModelSerializer):
    utilisateur_name = serializers.CharField(source='utilisateur.username', read_only=True)
    
    class Meta:
        model = TicketHistorique
        fields = '__all__'
        read_only_fields = ('date_action',)


class TicketSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    technicien_nom = serializers.CharField(source='technicien_assigne.username', read_only=True, allow_null=True)
    cree_par_nom = serializers.CharField(source='cree_par.username', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    priorite_display = serializers.CharField(source='get_priorite_display', read_only=True)
    historique = TicketHistoriqueSerializer(many=True, read_only=True)
    
    class Meta:
        model = Ticket
        fields = '__all__'
        read_only_fields = ('date_creation', 'date_modification', 'cree_par', 'numero')
    
    def get_client_name(self, obj):
        if obj.client:
            return obj.client.company or f"{obj.client.firstName} {obj.client.lastName}"
        return None