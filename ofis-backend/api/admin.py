from django.contrib import admin
from .models import (
    Client, OrdreTravail, DocumentOT, SuiviOT,
    RapportJournalier, LigneRapportJournalier,
    RapportHebdoCadre,
    SousService, Technician, Projet, HeureProjet,
    Ticket, TicketHistorique
)


@admin.register(SousService)
class SousServiceAdmin(admin.ModelAdmin):
    list_display = ['nom', 'service_parent']
    list_filter = ['service_parent']
    search_fields = ['nom']


@admin.register(Technician)
class TechnicianAdmin(admin.ModelAdmin):
    list_display = ['user', 'get_sous_services', 'phone']
    list_filter = ['sous_services']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'phone']
    filter_horizontal = ['sous_services']

    def get_sous_services(self, obj):
        return ", ".join([str(ss) for ss in obj.sous_services.all()])
    get_sous_services.short_description = 'Sous-services'


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['firstName', 'lastName', 'company', 'email', 'phone', 'createdAt']
    list_filter = ['company', 'createdAt']
    search_fields = ['firstName', 'lastName', 'company', 'email']


@admin.register(OrdreTravail)
class OrdreTravailAdmin(admin.ModelAdmin):
    list_display = ['reference', 'objet', 'get_techniciens', 'statut', 'statut_validation', 'estimation_heures', 'date_creation']
    list_filter = ['statut', 'statut_validation', 'date_creation']
    search_fields = ['reference', 'objet', 'techniciens__username']
    readonly_fields = ['reference', 'date_creation', 'date_debut', 'date_fin', 'date_validation', 'date_archivage']
    filter_horizontal = ['techniciens']

    def get_techniciens(self, obj):
        return ", ".join([t.username for t in obj.techniciens.all()])
    get_techniciens.short_description = 'Techniciens'


@admin.register(DocumentOT)
class DocumentOTAdmin(admin.ModelAdmin):
    list_display = ['ot', 'type', 'nom', 'uploaded_at']
    list_filter = ['type', 'uploaded_at']
    search_fields = ['ot__reference', 'nom']


@admin.register(SuiviOT)
class SuiviOTAdmin(admin.ModelAdmin):
    list_display = ['ot', 'technicien', 'date', 'heures', 'description']
    list_filter = ['date', 'ot__statut']
    search_fields = ['ot__reference', 'technicien__username', 'description']
    readonly_fields = ['created_at', 'updated_at']


class LigneRapportJournalierInline(admin.TabularInline):
    model = LigneRapportJournalier
    extra = 1
    fields = ['client', 'ot', 'nature_intervention', 'description', 'duree']


@admin.register(RapportJournalier)
class RapportJournalierAdmin(admin.ModelAdmin):
    list_display = ['technicien', 'date', 'created_at']
    list_filter = ['date']
    search_fields = ['technicien__username']
    inlines = [LigneRapportJournalierInline]
    readonly_fields = ['created_at', 'updated_at']


@admin.register(RapportHebdoCadre)
class RapportHebdoCadreAdmin(admin.ModelAdmin):
    list_display = ['cadre', 'date_debut', 'date_fin', 'type', 'created_at']
    list_filter = ['type', 'date_debut', 'date_fin']
    search_fields = ['cadre__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Projet)
class ProjetAdmin(admin.ModelAdmin):
    list_display = ['nom', 'chef_projet', 'estimation_heures', 'heures_consommees', 'avancement', 'statut', 'date_debut']
    list_filter = ['statut', 'date_debut']
    search_fields = ['nom', 'chef_projet__username']
    readonly_fields = ['created_at', 'updated_at']
    filter_horizontal = ['intervenants']

    def heures_consommees(self, obj):
        return f"{obj.heures_consommees} h"
    heures_consommees.short_description = 'Heures consommées'

    def avancement(self, obj):
        return f"{obj.avancement}%"
    avancement.short_description = 'Avancement'


@admin.register(HeureProjet)
class HeureProjetAdmin(admin.ModelAdmin):
    list_display = ['projet', 'intervenant', 'date', 'heures', 'description']
    list_filter = ['date', 'projet']
    search_fields = ['projet__nom', 'intervenant__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ['numero', 'titre', 'client', 'technicien_assigne', 'statut', 'priorite', 'date_creation']
    list_filter = ['statut', 'priorite', 'date_creation']
    search_fields = ['numero', 'titre', 'client__company', 'description']
    readonly_fields = ['numero', 'date_creation', 'date_modification', 'date_resolution', 'date_fermeture']
    raw_id_fields = ['client', 'technicien_assigne', 'cree_par']
    fieldsets = (
        ('Informations générales', {
            'fields': ('numero', 'titre', 'description', 'client', 'statut', 'priorite')
        }),
        ('Assignation', {
            'fields': ('technicien_assigne', 'cree_par')
        }),
        ('Traitement', {
            'fields': ('temps_passe', 'solution', 'commentaires')
        }),
        ('Dates', {
            'fields': ('date_creation', 'date_modification', 'date_resolution', 'date_fermeture')
        }),
    )


@admin.register(TicketHistorique)
class TicketHistoriqueAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'utilisateur', 'action', 'date_action']
    list_filter = ['date_action']
    search_fields = ['ticket__numero', 'ticket__titre', 'utilisateur__username', 'action']
    readonly_fields = ['date_action']