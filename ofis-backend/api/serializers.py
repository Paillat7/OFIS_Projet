from rest_framework import serializers
from django.contrib.auth.models import User

from .models import (
    Client, Technician, Manager, Mission, Report, Position, Team,
    GeneratedReport, GeneratedReportDownload,
    Service, Equipment, MissionV2, MissionReport,
    BonDeCommande, LigneBonDeCommande,
    RapportJournalier, RapportHebdomadaire,
    SuiviMedical, OrdreTravail, DocumentOT,
    RapportProjetCadre,
    RapportHebdoCadre, LigneRapportHebdoCadre , SuiviOT,  # ← AJOUT
)
from django.utils import timezone

# === SÉRIALISEUR PERSONNALISÉ POUR LE TOKEN JWT ===
# === SÉRIALISEUR PERSONNALISÉ POUR LE TOKEN JWT ===
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Déterminer le rôle par défaut
        if user.is_superuser:
            role = 'admin'
        elif user.is_staff:
            role = 'manager'
        else:
            role = 'technicien'
        # Si l'utilisateur est dans le groupe "Cadres", on change le rôle
        if user.groups.filter(name='Cadres').exists():
            role = 'cadre'
        token['role'] = role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        # Même logique pour la réponse
        if user.is_superuser:
            role = 'admin'
        elif user.is_staff:
            role = 'manager'
        else:
            role = 'technicien'
        if user.groups.filter(name='Cadres').exists():
            role = 'cadre'
        data['role'] = role
        data['username'] = user.username
        data['user_id'] = user.id  # ← AJOUT
        return data

# === SÉRIALISEURS POUR LES NOUVEAUX RAPPORTS ===

class GeneratedReportSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    filename = serializers.CharField(read_only=True)
    is_generated = serializers.BooleanField(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = GeneratedReport
        fields = [
            'id', 'title', 'description', 'report_type', 'format',
            'status', 'file', 'file_url', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'generated_at', 'parameters',
            'download_count', 'file_size', 'original_filename', 'filename',
            'is_generated'
        ]
        read_only_fields = [
            'created_by', 'created_at', 'updated_at', 'generated_at',
            'download_count', 'file_size', 'status', 'is_generated'
        ]

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None


class GeneratedReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneratedReport
        fields = ['title', 'description', 'report_type', 'format', 'parameters']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class GeneratedReportUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneratedReport
        fields = ['title', 'description', 'report_type', 'format', 'file']

    def validate_file(self, value):
        if value.size > 50 * 1024 * 1024:  # 50MB max
            raise serializers.ValidationError("Le fichier ne doit pas dépasser 50MB")
        return value

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        validated_data['status'] = 'genere'
        validated_data['generated_at'] = timezone.now()
        validated_data['original_filename'] = validated_data['file'].name
        return super().create(validated_data)


class GeneratedReportDownloadSerializer(serializers.ModelSerializer):
    downloaded_by_name = serializers.CharField(source='downloaded_by.get_full_name', read_only=True)
    report_title = serializers.CharField(source='report.title', read_only=True)

    class Meta:
        model = GeneratedReportDownload
        fields = ['id', 'report', 'report_title', 'downloaded_by',
                  'downloaded_by_name', 'downloaded_at', 'ip_address']
        read_only_fields = ['downloaded_by', 'downloaded_at', 'ip_address']


# === SÉRIALISEURS POUR LES RAPPORTS EXISTANTS ===

class ReportSerializer(serializers.ModelSerializer):
    created_by_username = serializers.ReadOnlyField(source='created_by.username')
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            'id', 'title', 'description', 'content', 'report_type', 'format',
            'file', 'file_url', 'file_size', 'file_name',
            'created_by', 'created_by_username',
            'created_at', 'updated_at', 'parameters',
            'is_generated', 'download_count', 'mission', 'technician',
            'reportDate', 'hoursWorked', 'materialsUsed', 'recommendations',
            'isApproved', 'approvedBy'
        ]
        read_only_fields = ['created_at', 'updated_at', 'download_count', 'file_size']

    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None


class ReportUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['title', 'description', 'report_type', 'format', 'file']


# === SÉRIALISEURS POUR LES POSITIONS ===

class PositionSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    team_name = serializers.ReadOnlyField(source='team.name')

    class Meta:
        model = Position
        fields = ['id', 'team', 'team_name', 'user', 'username',
                  'latitude', 'longitude', 'accuracy', 'timestamp']
        read_only_fields = ['timestamp']


# === SÉRIALISEURS POUR LES AUTRES MODÈLES ===

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

class TechnicianSerializer(serializers.ModelSerializer):
    user_full_name = serializers.SerializerMethodField()
    service_name = serializers.CharField(source='service.name', read_only=True)

    class Meta:
        model = Technician
        fields = '__all__'

    def get_user_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}" if obj.user else ""


class ManagerSerializer(serializers.ModelSerializer):
    user_full_name = serializers.SerializerMethodField()

    class Meta:
        model = Manager
        fields = '__all__'

    def get_user_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}" if obj.user else ""


class MissionSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    technician_name = serializers.SerializerMethodField()
    manager_name = serializers.SerializerMethodField()

    class Meta:
        model = Mission
        fields = '__all__'

    def get_client_name(self, obj):
        if obj.client:
            return f"{obj.client.firstName} {obj.client.lastName}"
        return ""

    def get_technician_name(self, obj):
        if obj.technician and obj.technician.user:
            return f"{obj.technician.user.first_name} {obj.technician.user.last_name}"
        return ""

    def get_manager_name(self, obj):
        if obj.manager and obj.manager.user:
            return f"{obj.manager.user.first_name} {obj.manager.user.last_name}"
        return ""


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name',
                  'is_staff', 'is_active', 'is_superuser']
        read_only_fields = ['id']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


# ===== TEAM SERIALIZER =====
class TeamSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service_obj.name', read_only=True)
    leader_name = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()
    members_details = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = '__all__'

    def get_leader_name(self, obj):
        if obj.leader:
            return f"{obj.leader.first_name} {obj.leader.last_name}".strip() or obj.leader.username
        return None

    def get_members_count(self, obj):
        return obj.members.count()

    def get_members_details(self, obj):
        members = []
        for user in obj.members.all():
            members.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser
            })
        return members


# ===== SÉRIALISEURS POUR LES SERVICES ET MATÉRIEL (MODIFIÉ) =====

class ServiceSerializer(serializers.ModelSerializer):
    teams_count = serializers.SerializerMethodField()
    equipment_count = serializers.SerializerMethodField()
    missions_count = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = '__all__'

    def get_teams_count(self, obj):
        return obj.teams.count()

    def get_equipment_count(self, obj):
        return obj.equipment.count()

    def get_missions_count(self, obj):
        return MissionV2.objects.filter(service=obj).count()


class EquipmentSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)

    class Meta:
        model = Equipment
        fields = '__all__'


# ===== MISSIONV2 SERIALIZER =====
class MissionV2Serializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    client_name = serializers.SerializerMethodField()
    assigned_to_names = serializers.SerializerMethodField()
    assigned_to_ids = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = MissionV2
        fields = '__all__'

    def get_client_name(self, obj):
        if obj.client:
            return f"{obj.client.firstName} {obj.client.lastName}"
        return ""

    def get_assigned_to_names(self, obj):
        return [f"{u.first_name} {u.last_name}".strip() or u.username for u in obj.assigned_to.all()]

    def get_assigned_to_ids(self, obj):
        return [user.id for user in obj.assigned_to.all()]


class MissionReportSerializer(serializers.ModelSerializer):
    technician_name = serializers.CharField(source='technician.username', read_only=True)
    mission_title = serializers.CharField(source='mission.title', read_only=True)

    class Meta:
        model = MissionReport
        fields = '__all__'


# ===== SÉRIALISEURS POUR BONS DE COMMANDE =====

class LigneBonDeCommandeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneBonDeCommande
        fields = '__all__'

class BonDeCommandeSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.__str__', read_only=True)
    lignes = LigneBonDeCommandeSerializer(many=True, read_only=True)
    qr_code_url = serializers.SerializerMethodField()
    devise_display = serializers.CharField(source='get_devise_display', read_only=True)
    technicien = serializers.SerializerMethodField()
    ot_statut = serializers.SerializerMethodField()

    class Meta:
        model = BonDeCommande
        fields = '__all__'
        read_only_fields = ('numero', 'montant_ttc', 'qr_code', 'date_creation',
                            'date_validation', 'date_paiement', 'pdf_genere', 'devise_display')

    def get_qr_code_url(self, obj):
        if obj.qr_code:
            return f"/api/bons/{obj.id}/qr/"
        return None

    def get_technicien(self, obj):
        techniciens = [ot.technicien.username for ot in obj.ordres_travail.all() if ot.technicien]
        return ', '.join(techniciens) if techniciens else None

    def get_ot_statut(self, obj):
        ot = obj.ordres_travail.first()
        if ot:
            return ot.statut
        return None


# ===== SÉRIALISEURS POUR LES RAPPORTS JOURNALIERS =====
class RapportJournalierSerializer(serializers.ModelSerializer):
    technicien_name = serializers.CharField(source='technicien.username', read_only=True)
    mission_title = serializers.CharField(source='mission.title', read_only=True)
    client_name = serializers.CharField(source='client.__str__', read_only=True)

    class Meta:
        model = RapportJournalier
        fields = '__all__'
        read_only_fields = ('technicien', 'date')


class RapportHebdomadaireSerializer(serializers.ModelSerializer):
    cadre_name = serializers.CharField(source='cadre.username', read_only=True)

    class Meta:
        model = RapportHebdomadaire
        fields = '__all__'
        read_only_fields = ('created_at',)


# ===== SÉRIALISEURS POUR LES RAPPORTS DE PROJET =====


# ===== SÉRIALISEUR POUR LE SUIVI MÉDICAL =====
class SuiviMedicalSerializer(serializers.ModelSerializer):
    jours_restants = serializers.SerializerMethodField()
    alerte = serializers.SerializerMethodField()

    class Meta:
        model = SuiviMedical
        fields = '__all__'

    def get_jours_restants(self, obj):
        return obj.jours_restants()

    def get_alerte(self, obj):
        return obj.alerte()
class DocumentOTSerializer(serializers.ModelSerializer):
    fichier_url = serializers.SerializerMethodField()

    class Meta:
        model = DocumentOT
        fields = ['id', 'type', 'fichier', 'fichier_url', 'nom', 'uploaded_at']
        read_only_fields = ['uploaded_at']

    def get_fichier_url(self, obj):
        if obj.fichier:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.fichier.url)
            return obj.fichier.url
        return None

        
class OrdreTravailSerializer(serializers.ModelSerializer):
    mission_title = serializers.SerializerMethodField()
    mission_client_name = serializers.SerializerMethodField()
    mission_location = serializers.SerializerMethodField()
    client_rapport_name = serializers.SerializerMethodField()
    technicien_username = serializers.CharField(source='technicien.username', read_only=True)
    technicien_id = serializers.IntegerField(source='technicien.id', read_only=True)
    bon_commande_numero = serializers.CharField(source='bon_commande.numero', read_only=True)
    valide_par_username = serializers.CharField(source='valide_par.username', read_only=True)
    documents = DocumentOTSerializer(many=True, read_only=True)

    class Meta:
        model = OrdreTravail
        fields = '__all__'
        # ✅ SUPPRIMER 'reference' de read_only_fields
        read_only_fields = (
            'date_creation', 'date_debut', 'date_fin', 
            'date_validation', 'valide_par', 'date_archivage'
        )

        extra_kwargs = {
            'reference': {'read_only': False}   # ← forcer l'écriture

        }

    def get_mission_title(self, obj):
        return obj.mission.title if obj.mission else None

    def get_mission_client_name(self, obj):
        return str(obj.mission.client) if obj.mission and obj.mission.client else None

    def get_mission_location(self, obj):
        return obj.mission.location if obj.mission else None

    def get_client_rapport_name(self, obj):
        return str(obj.client_rapport) if obj.client_rapport else None

    # ✅ EMPÊCHER LA MODIFICATION DE LA RÉFÉRENCE LORS D'UNE ÉDITION
    def update(self, instance, validated_data):
        validated_data.pop('reference', None)   # on ignore toute référence envoyée
        return super().update(instance, validated_data)


class SuiviOTSerializer(serializers.ModelSerializer):
    technicien_name = serializers.CharField(source='technicien.username', read_only=True)

    class Meta:
        model = SuiviOT
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'technicien')


class RapportProjetCadreSerializer(serializers.ModelSerializer):
    cadre_name = serializers.CharField(source='cadre.username', read_only=True)
    # Ajoutez ce champ pour avoir l'ID du cadre
    cadre_id = serializers.IntegerField(source='cadre.id', read_only=True)

    class Meta:
        model = RapportProjetCadre
        fields = '__all__'  # inclut déjà cadre, mais on ajoute cadre_id explicitement
        read_only_fields = ('date_creation', 'date_modification')


# ===== RAPPORT HEBDOMADAIRE CADRE (nouvelle version) =====

class LigneRapportHebdoCadreSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.__str__', read_only=True)
    intervenant_name = serializers.CharField(source='intervenant.username', read_only=True)

    class Meta:
        model = LigneRapportHebdoCadre
        fields = '__all__'
        read_only_fields = ('rapport',)   # le rapport est affecté automatiquement


class RapportHebdoCadreSerializer(serializers.ModelSerializer):
    cadre_name = serializers.CharField(source='cadre.username', read_only=True)
    lignes = LigneRapportHebdoCadreSerializer(many=True, required=False)
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = RapportHebdoCadre
        fields = ['id', 'cadre', 'cadre_name', 'date_debut', 'date_fin', 'type', 'type_display', 'lignes', 'created_at', 'updated_at']
        read_only_fields = ('cadre', 'created_at', 'updated_at')

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes', [])
        rapport = RapportHebdoCadre.objects.create(**validated_data)
        for ligne_data in lignes_data:
            LigneRapportHebdoCadre.objects.create(rapport=rapport, **ligne_data)
        return rapport

    def update(self, instance, validated_data):
        lignes_data = validated_data.pop('lignes', [])
        instance = super().update(instance, validated_data)
        instance.lignes.all().delete()
        for ligne_data in lignes_data:
            LigneRapportHebdoCadre.objects.create(rapport=instance, **ligne_data)
        return instance