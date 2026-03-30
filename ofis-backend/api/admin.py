from django.contrib import admin
from .models import (
    Technician, Manager, Client, Mission, Report,
    GeneratedReport, GeneratedReportDownload,
    Team, Position, Service, Equipment,
    MissionV2, MissionReport,
    BonDeCommande, LigneBonDeCommande,
    RapportJournalier, RapportHebdomadaire,
    SuiviMedical,
    OrdreTravail, DocumentOT,
    RapportProjetCadre,
    RapportHebdoCadre, LigneRapportHebdoCadre,
    SuiviOT
)
# ===== MODÈLES SIMPLES =====
admin.site.register(Technician)
admin.site.register(Manager)
admin.site.register(Client)
admin.site.register(Mission)
admin.site.register(Report)

# ===== BON DE COMMANDE =====
@admin.register(BonDeCommande)
class BonDeCommandeAdmin(admin.ModelAdmin):
    list_display = ['numero', 'client', 'montant_ttc', 'statut', 'date_creation']
    list_filter = ['statut', 'date_creation']
    search_fields = ['numero', 'client__firstName', 'client__lastName']

@admin.register(LigneBonDeCommande)
class LigneBonDeCommandeAdmin(admin.ModelAdmin):
    list_display = ['bon', 'description', 'quantite', 'prix_unitaire_ht', 'montant_ht']

# ===== RAPPORTS GÉNÉRÉS =====
@admin.register(GeneratedReport)
class GeneratedReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'report_type', 'format', 'status', 'created_by', 'created_at', 'download_count']
    list_filter = ['report_type', 'format', 'status', 'created_at']
    search_fields = ['title', 'description', 'created_by__username']
    readonly_fields = ['created_at', 'updated_at', 'download_count', 'file_size', 'filename']
    fieldsets = (
        ('Informations générales', {
            'fields': ('title', 'description', 'report_type', 'format', 'status')
        }),
        ('Fichier', {
            'fields': ('file', 'original_filename', 'file_size', 'download_count')
        }),
        ('Métadonnées', {
            'fields': ('created_by', 'created_at', 'updated_at', 'generated_at', 'parameters')
        }),
    )
    def filename(self, obj):
        return obj.filename
    filename.short_description = 'Nom du fichier'

@admin.register(GeneratedReportDownload)
class GeneratedReportDownloadAdmin(admin.ModelAdmin):
    list_display = ['id', 'report', 'downloaded_by', 'downloaded_at', 'ip_address']
    list_filter = ['downloaded_at']
    search_fields = ['report__title', 'downloaded_by__username']
    readonly_fields = ['downloaded_at']

# ===== ÉQUIPES ET POSITIONS =====
@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'service', 'location', 'leaderId']
    search_fields = ['name', 'service']

@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ['team', 'user', 'latitude', 'longitude', 'timestamp']
    list_filter = ['team', 'timestamp']
    readonly_fields = ['timestamp']

# ===== SERVICES ET MATÉRIEL =====
@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'color', 'created_at']
    search_fields = ['name']
    list_filter = ['color']

@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'reference', 'service', 'team', 'quantity']
    list_filter = ['type', 'service', 'team']
    search_fields = ['name', 'reference', 'model']
    readonly_fields = ['created_at', 'updated_at']

# ===== MISSIONS V2 =====
@admin.register(MissionV2)
class MissionV2Admin(admin.ModelAdmin):
    list_display = ['title', 'service', 'team', 'status', 'priority', 'start_date', 'end_date']
    list_filter = ['status', 'priority', 'service', 'team']
    search_fields = ['title', 'description', 'location']
    readonly_fields = ['created_at', 'updated_at']
    filter_horizontal = ['assigned_to']

@admin.register(MissionReport)
class MissionReportAdmin(admin.ModelAdmin):
    list_display = ['mission', 'technician', 'hours_worked', 'created_at']
    list_filter = ['created_at']
    search_fields = ['mission__title', 'technician__username']
    readonly_fields = ['created_at']

# ===== RAPPORTS (JOURNALIER, HEBDOMADAIRE, PROJET) =====
@admin.register(RapportJournalier)
class RapportJournalierAdmin(admin.ModelAdmin):
    list_display = ['mission', 'technicien', 'date']
    list_filter = ['date']
    search_fields = ['mission__title', 'technicien__username']

@admin.register(RapportHebdomadaire)
class RapportHebdomadaireAdmin(admin.ModelAdmin):
    list_display = ['cadre', 'date_debut', 'date_fin']
    list_filter = ['date_debut', 'date_fin']
    search_fields = ['cadre__username']

# Inline pour RapportProjet


# ===== SUIVI MÉDICAL =====
@admin.register(SuiviMedical)
class SuiviMedicalAdmin(admin.ModelAdmin):
    list_display = ['nom', 'prenom', 'service', 'date_delivrance', 'date_expiration']
    list_filter = ['service', 'date_expiration']
    search_fields = ['nom', 'prenom', 'service']

# ===== ORDRE DE TRAVAIL =====
@admin.register(OrdreTravail)
class OrdreTravailAdmin(admin.ModelAdmin):
    list_display = ['reference', 'reference_externe', 'code_client', 'mission', 'technicien', 'statut', 'statut_validation', 'date_creation']
    list_filter = ['statut', 'statut_validation']
    search_fields = ['reference', 'reference_externe', 'code_client', 'mission__title', 'technicien__username']
    readonly_fields = ['reference', 'date_creation', 'date_validation', 'valide_par']

@admin.register(DocumentOT)
class DocumentOTAdmin(admin.ModelAdmin):
    list_display = ['ot', 'type', 'nom', 'uploaded_at']
    list_filter = ['type']
    search_fields = ['ot__reference', 'nom']

# ===== RAPPORT PROJET CADRE (simplifié) =====
@admin.register(RapportProjetCadre)
class RapportProjetCadreAdmin(admin.ModelAdmin):
    list_display = ['nom_projet', 'cadre', 'avancement', 'date_creation']
    list_filter = ['avancement', 'date_creation']
    search_fields = ['nom_projet', 'cadre__username']

# ===== RAPPORT HEBDOMADAIRE CADRE (avec ses lignes) =====
# Inline pour les lignes du rapport hebdomadaire (plus de champ 'duree')
class LigneRapportHebdoCadreInline(admin.TabularInline):
    model = LigneRapportHebdoCadre
    extra = 1
    # readonly_fields = ()   # aucun champ en lecture seule spécifique

@admin.register(RapportHebdoCadre)
class RapportHebdoCadreAdmin(admin.ModelAdmin):
    list_display = ('cadre', 'date_debut', 'date_fin', 'type', 'created_at')
    inlines = [LigneRapportHebdoCadreInline]

# ===== SUIVI QUOTIDIEN DES OT =====
@admin.register(SuiviOT)
class SuiviOTAdmin(admin.ModelAdmin):
    list_display = ['ot', 'date', 'heures', 'description']
    list_filter = ['date', 'ot__technicien']
    search_fields = ['ot__reference', 'description']
    readonly_fields = ['created_at', 'updated_at']