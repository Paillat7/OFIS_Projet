from django.db import models
from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
import os
from django.utils import timezone
import uuid

# NE PAS redéfinir User = get_user_model() ici, utilisez directement User de django.contrib.auth.models


# ===== 1. SERVICES =====
class Service(models.Model):
    SERVICE_TYPES = [
        ('OBT Radio', 'OBT Radio'),
        ('OBT Géolocalisation', 'OBT Géolocalisation'),
        ('OSN Réseau', 'OSN Réseau'),
        ('OSN Système', 'OSN Système'),
    ]
    
    name = models.CharField(max_length=50, choices=SERVICE_TYPES, unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=20, default='#3b82f6')
    icon = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.get_name_display()


# ===== 2. ÉQUIPES =====
class Team(models.Model):
    name = models.CharField(max_length=100)
    service = models.CharField(max_length=100)
    location = models.CharField(max_length=200)
    leaderId = models.IntegerField(null=True, blank=True)
    memberIds = models.JSONField(default=list)
    missions = models.JSONField(default=list)
    
    service_obj = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True, related_name='teams')
    leader = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='led_teams')
    members = models.ManyToManyField(User, related_name='teams', blank=True)
    
    def __str__(self):
        return self.name


# ===== 3. POSITIONS GPS =====
class Position(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='positions', null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='positions')
    latitude = models.FloatField()
    longitude = models.FloatField()
    accuracy = models.FloatField(help_text="Précision en mètres")
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['team', '-timestamp']),
            models.Index(fields=['user', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.timestamp}"


# ===== 4. TECHNICIENS =====


class Technician(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    specialization = models.CharField(max_length=100)
    hireDate = models.DateField()
    phone = models.CharField(max_length=20)
    isAvailable = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}"


# ===== 5. MANAGERS =====
class Manager(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    department = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    officeNumber = models.CharField(max_length=20, blank=True)
    
    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} (Manager)"


# ===== 6. CLIENTS =====
class Client(models.Model):
    firstName = models.CharField(max_length=100)
    lastName = models.CharField(max_length=100)
    company = models.CharField(max_length=200, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)   # ← AJOUT

    def __str__(self):
        return f"{self.firstName} {self.lastName}"


# ===== 7. MISSIONS (ancienne version) =====
class Mission(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='missions')
    technician = models.ForeignKey(Technician, on_delete=models.SET_NULL, null=True, blank=True)
    manager = models.ForeignKey(Manager, on_delete=models.SET_NULL, null=True)
    
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('assigned', 'Assignée'),
        ('in_progress', 'En cours'),
        ('completed', 'Terminée'),
        ('cancelled', 'Annulée'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    priority = models.CharField(max_length=20, choices=[
        ('low', 'Basse'),
        ('medium', 'Moyenne'),
        ('high', 'Haute'),
    ])
    
    startDate = models.DateField()
    endDate = models.DateField(null=True, blank=True)
    estimatedHours = models.IntegerField()
    actualHours = models.IntegerField(null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title


# ===== 8. RAPPORTS (anciens) =====
class Report(models.Model):
    mission = models.ForeignKey(Mission, on_delete=models.CASCADE, related_name='reports')
    technician = models.ForeignKey(Technician, on_delete=models.SET_NULL, null=True)
    reportDate = models.DateField(auto_now_add=True)
    content = models.TextField()
    hoursWorked = models.IntegerField()
    materialsUsed = models.TextField(blank=True)
    recommendations = models.TextField(blank=True)
    isApproved = models.BooleanField(default=False)
    approvedBy = models.ForeignKey(Manager, on_delete=models.SET_NULL, null=True, blank=True)
    
    def __str__(self):
        return f"Rapport {self.mission.title} - {self.reportDate}"


# ===== 9. RAPPORTS GÉNÉRIQUES =====
class GeneratedReport(models.Model):
    REPORT_TYPES = [
        ('mensuel', 'Rapport mensuel'),
        ('client', 'Par client'),
        ('validation', 'Validation'),
        ('personnalise', 'Personnalisé'),
        ('depose', 'Rapport déposé'),
    ]
    
    FORMAT_TYPES = [
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
        ('csv', 'CSV'),
        ('doc', 'Word'),
        ('docx', 'Word'),
        ('xls', 'Excel'),
        ('xlsx', 'Excel'),
        ('txt', 'Texte'),
    ]
    
    STATUS_CHOICES = [
        ('en_attente', 'En attente'),
        ('en_cours', 'En cours de génération'),
        ('genere', 'Généré'),
        ('erreur', 'Erreur'),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES, default='mensuel')
    format = models.CharField(max_length=10, choices=FORMAT_TYPES, default='pdf')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='en_attente')
    
    file = models.FileField(
        upload_to='generated_reports/',
        null=True,
        blank=True,
        validators=[FileExtensionValidator(
            allowed_extensions=['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt']
        )]
    )
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='generated_reports')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    generated_at = models.DateTimeField(null=True, blank=True)
    parameters = models.JSONField(default=dict, blank=True)
    download_count = models.IntegerField(default=0)
    file_size = models.IntegerField(null=True, blank=True)
    original_filename = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Rapport généré"
        verbose_name_plural = "Rapports générés"
    
    def __str__(self):
        return f"{self.title} ({self.get_report_type_display()})"
    
    @property
    def is_generated(self):
        return self.status == 'genere' and self.file
    
    @property
    def filename(self):
        if self.file:
            return os.path.basename(self.file.name)
        return None
    
    def get_absolute_url(self):
        return f"/reports/{self.id}/"

# ===== 10. TÉLÉCHARGEMENTS DE RAPPORTS =====
class GeneratedReportDownload(models.Model):
    report = models.ForeignKey(GeneratedReport, on_delete=models.CASCADE, related_name='downloads')
    downloaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    downloaded_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        ordering = ['-downloaded_at']
        verbose_name = "Téléchargement de rapport"
        verbose_name_plural = "Téléchargements de rapports"
    
    def __str__(self):
        return f"{self.report.title} - {self.downloaded_at}"


# ===== 11. MATÉRIEL =====
class Equipment(models.Model):
    EQUIPMENT_TYPES = [
        ('equipement', 'Équipement physique'),
        ('balise', 'Balise GPS'),
        ('logiciel', 'Logiciel'),
        ('systeme', 'Système'),
        ('antenne', 'Antenne'),
        ('câble', 'Câble'),
        ('composant', 'Composant'),
    ]
    
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=EQUIPMENT_TYPES, default='equipement')
    model = models.CharField(max_length=100, blank=True)
    reference = models.CharField(max_length=100, unique=True)
    supplier = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    quantity = models.IntegerField(default=1)
    image = models.ImageField(upload_to='equipment/', blank=True, null=True)
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='equipment')
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name='equipment_list')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} - {self.reference}"


# ===== 12. MISSIONS V2 =====
class MissionV2(models.Model):
    STATUS_CHOICES = [
        ('planifiee', 'Planifiée'),
        ('en_cours', 'En cours'),
        ('terminee', 'Terminée'),
        ('annulee', 'Annulée'),
    ]
    
    PRIORITY_CHOICES = [
        ('haute', 'Haute'),
        ('moyenne', 'Moyenne'),
        ('basse', 'Basse'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='missions_v2')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='missions')
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, related_name='missions_v2')
    assigned_to = models.ManyToManyField(User, related_name='missions_assigned', blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planifiee')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='moyenne')
    location = models.CharField(max_length=200)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    estimated_hours = models.IntegerField(default=0)
    actual_hours = models.IntegerField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_missions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


# ===== 13. RAPPORTS DE MISSION =====
class MissionReport(models.Model):
    mission = models.ForeignKey(MissionV2, on_delete=models.CASCADE, related_name='reports')
    technician = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    hours_worked = models.IntegerField()
    materials_used = models.TextField(blank=True)
    recommendations = models.TextField(blank=True)
    photos = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Rapport {self.mission.title} - {self.created_at}"


# ===== 14. BONS DE COMMANDE =====
class BonDeCommande(models.Model):
    DEVISE_CHOICES = [
        ('EUR', 'Euro (€)'),
        ('USD', 'Dollar ($)'),
        ('GBP', 'Livre sterling (£)'),
        ('XAF', 'Franc CFA (FCFA)'),   # Afrique centrale
        ('XOF', 'Franc CFA (FCFA)'),   # Afrique de l'ouest
        ('MAD', 'Dirham marocain (MAD)'),
        ('DZD', 'Dinar algérien (DA)'),
        ('TND', 'Dinar tunisien (DT)'),
        ('AED', 'Dirham émirati (AED)'),
        ('CNY', 'Yuan chinois (CNY)'),
        ('JPY', 'Yen japonais (¥)'),
    ]
    
    numero = models.CharField(max_length=50, unique=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='bons')
    mission = models.OneToOneField(MissionV2, on_delete=models.SET_NULL, null=True, blank=True, related_name='bon')
    date_creation = models.DateTimeField(auto_now_add=True)
    montant_ht = models.DecimalField(max_digits=10, decimal_places=2)
    tva = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    montant_ttc = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    devise = models.CharField(max_length=3, choices=DEVISE_CHOICES, default='EUR')
    statut = models.CharField(max_length=20, choices=[
        ('en_attente', 'En attente'),
        ('valide', 'Validé'),
        ('paye', 'Payé'),
        ('annule', 'Annulé')
    ], default='en_attente')
    qr_code = models.CharField(max_length=255, blank=True, null=True, unique=True)
    pdf_genere = models.FileField(upload_to='bons/', blank=True, null=True)
    date_validation = models.DateTimeField(null=True, blank=True)
    date_paiement = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        self.montant_ttc = self.montant_ht * (1 + self.tva/100)
        if not self.numero:
            last = BonDeCommande.objects.order_by('-id').first()
            last_id = last.id if last else 0
            self.numero = f"BC-{timezone.now().year}-{last_id+1:04d}"
        if not self.qr_code:
            self.qr_code = str(uuid.uuid4())
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.numero} - {self.client} ({self.get_devise_display()})"


# ===== 15. LIGNES DE BON DE COMMANDE =====
class LigneBonDeCommande(models.Model):
    """Ligne de détail d'un bon de commande"""
    bon = models.ForeignKey(BonDeCommande, on_delete=models.CASCADE, related_name='lignes')
    description = models.CharField(max_length=255)
    quantite = models.IntegerField(default=1)
    prix_unitaire_ht = models.DecimalField(max_digits=10, decimal_places=2)
    montant_ht = models.DecimalField(max_digits=10, decimal_places=2, editable=False)

    def save(self, *args, **kwargs):
        self.montant_ht = self.quantite * self.prix_unitaire_ht
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} x{self.quantite}"

# ===== 16. RAPPORTS JOURNALIERS (technicien) =====
# models.py

class RapportJournalier(models.Model):
    SERVICE_CHOICES = [
        ('OSN', 'OSN'),
        ('OBT', 'OBT'),
        # Vous pouvez ajouter d'autres choix si besoin
    ]
    mission = models.ForeignKey(
        MissionV2, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='rapports_journaliers'
    )
    technicien = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rapports_journaliers')
    date = models.DateField(auto_now_add=True)
    heure_depart = models.TimeField()
    heure_arrivee = models.TimeField()
    heure_rdv = models.TimeField()
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    service = models.CharField(max_length=3, choices=SERVICE_CHOICES)  # ← Nouveau champ obligatoire
    type_intervention = models.CharField(max_length=100)
    rdv_planifie = models.BooleanField(default=True)
    description = models.TextField()
    rit_signe = models.BooleanField(default=False)
    pv_signe = models.BooleanField(default=False)
    conclusions = models.TextField(blank=True)

    def __str__(self):
        if self.mission:
            return f"Rapport journalier {self.mission.title} - {self.date}"
        return f"Rapport journalier (sans mission) - {self.date}"

# ===== 17. RAPPORTS HEBDOMADAIRES (cadre) =====
class RapportHebdomadaire(models.Model):
    cadre = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rapports_hebdomadaires')
    date_debut = models.DateField()
    date_fin = models.DateField()
    activites = models.TextField()
    objectifs_atteints = models.TextField()
    difficultes = models.TextField()
    propositions = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Rapport hebdo {self.cadre.username} - {self.date_debut}"


# ===== 18. RAPPORTS DE PROJET (ingénieur) =====
class RapportProjet(models.Model):
    projet = models.CharField(max_length=200)
    ingenieur = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rapports_projet')
    date = models.DateField(auto_now_add=True)
    avancement = models.IntegerField(help_text="Pourcentage réalisé")
    taches_realisees = models.TextField()
    prochaines_taches = models.TextField()
    remarques = models.TextField(blank=True)

    def __str__(self):
        return f"Rapport projet {self.projet} - {self.ingenieur.username}"


# ===== 19. SUIVI MÉDICAL (assistante) =====
class SuiviMedical(models.Model):
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    service = models.CharField(max_length=100)
    date_delivrance = models.DateField()
    date_expiration = models.DateField()
    type_certificat = models.CharField(max_length=100, blank=True)
    clinique = models.CharField(max_length=100, blank=True)

    def jours_restants(self):
        from datetime import date
        if self.date_expiration:
            return (self.date_expiration - date.today()).days
        return None

    def alerte(self):
        jours = self.jours_restants()
        if jours is None:
            return "Date inconnue"
        if jours < 0:
            return "Expiré"
        if jours < 30:
            return f"À renouveler (plus que {jours} jours)"
        return "RAS"

    def __str__(self):
        return f"{self.nom} {self.prenom}"

class OrdreTravail(models.Model):
    STATUT_CHOICES = [
        ('planifie', 'Planifié'),
        ('en_cours', 'En cours'),
        ('termine', 'Terminé'),
        ('annule', 'Annulé'),
    ]
    VALIDATION_CHOICES = [
        ('en_attente', 'En attente de validation'),
        ('valide', 'Validé'),
        ('rejete', 'Rejeté'),
    ]
    
    reference = models.CharField(max_length=50, unique=True)
    reference_externe = models.CharField(max_length=50, blank=True, help_text="Référence SAGE (OT)")
    reference_devis = models.CharField(max_length=50, blank=True, help_text="Référence devis")
    reference_bc_externe = models.CharField(max_length=50, blank=True, help_text="Référence bon de commande externe")
    code_client = models.CharField(max_length=50, blank=True, help_text="Code client (BP code)")
    duree_estimee = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="Durée estimée en heures")
    
    mission = models.ForeignKey(
        'MissionV2',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='ordres_travail'
    )
    objet = models.CharField(max_length=255, blank=True, help_text="Objet de l'intervention (saisie libre)")
    lieu = models.CharField(max_length=255, blank=True, help_text="Lieu de l'intervention")
    
    bon_commande = models.ForeignKey('BonDeCommande', on_delete=models.SET_NULL, null=True, blank=True, related_name='ordres_travail')
    
    # Un seul technicien
    technicien = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ordres_travail')
    
    date_creation = models.DateTimeField(auto_now_add=True)
    date_debut = models.DateTimeField(null=True, blank=True)
    date_fin = models.DateTimeField(null=True, blank=True)
    date_validation = models.DateTimeField(null=True, blank=True)
    date_archivage = models.DateTimeField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='planifie')
    statut_validation = models.CharField(max_length=20, choices=VALIDATION_CHOICES, default='en_attente')
    valide_par = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ot_valides')
    
    # Champs pour le rapport (plus utilisés, mais conservés)
    intervenants = models.CharField(max_length=255, blank=True)
    date_intervention = models.DateField(null=True, blank=True)
    heure_depart_nasa = models.TimeField(null=True, blank=True)
    heure_arrivee_client = models.TimeField(null=True, blank=True)
    heure_rdv_client = models.TimeField(null=True, blank=True)
    client_rapport = models.ForeignKey('Client', on_delete=models.CASCADE)   # obligatoire
    type_intervention = models.CharField(max_length=100, blank=True)
    rdv_planifie = models.BooleanField(default=True)
    description = models.TextField(blank=True)
    rit_signe = models.BooleanField(default=False)
    pv_signe = models.BooleanField(default=False)
    conclusions = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.reference:
            last = OrdreTravail.objects.order_by('-id').first()
            last_id = last.id if last else 0
            self.reference = f"OT-{timezone.now().year}-{last_id+1:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        if self.mission:
            return f"{self.reference} - {self.mission.title}"
        elif self.objet:
            return f"{self.reference} - {self.objet}"
        else:
            return self.reference

class SuiviOT(models.Model):
    ot = models.ForeignKey('OrdreTravail', on_delete=models.CASCADE, related_name='suivis')
    technicien = models.ForeignKey(User, on_delete=models.CASCADE, related_name='suivis_ot')
    date = models.DateField()
    heures = models.DecimalField(max_digits=5, decimal_places=2, help_text="Heures travaillées ce jour")
    description = models.TextField(blank=True, help_text="Description des tâches effectuées")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('ot', 'technicien', 'date')
        ordering = ['-date']

class DocumentOT(models.Model):
    TYPE_CHOICES = [
        ('photo', 'Photo'),
        ('pv', 'Procès-verbal'),
        ('bl', 'Bon de livraison'),
        ('qualite', 'Fiche qualité'),
        ('autre', 'Autre'),
    ]
    ot = models.ForeignKey(OrdreTravail, on_delete=models.CASCADE, related_name='documents')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    fichier = models.FileField(upload_to='ot_documents/')
    nom = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.ot.reference} - {self.type}"


# ===== 21. PLANNING HEBDOMADAIRE =====
class PlanningHebdomadaire(models.Model):
    technicien = models.ForeignKey(User, on_delete=models.CASCADE, related_name='plannings')
    semaine = models.DateField()  # date du lundi de la semaine concernée
    jours = models.JSONField(default=dict)  # ex: {"lundi": [{"heure_debut": "08:00", "heure_fin": "12:00", "mission": 1}], ...}
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='plannings_crees')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['technicien', 'semaine']





class RapportProjetCadre(models.Model):
    cadre = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rapports_projet_cadre')
    nom_projet = models.CharField(max_length=200)
    avancement = models.IntegerField(help_text="Pourcentage réalisé (0-100)")
    taches_realisees = models.TextField()
    prochaines_taches = models.TextField()
    remarques = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nom_projet} - {self.cadre.username}"


class RapportHebdoCadre(models.Model):
    TYPE_CHOICES = [
        ('av', 'Avant-Vente'),
        ('projets', 'Projets'),
        ('maintenances', 'Maintenances / Interventions'),
        ('autres', 'Autres'),
    ]

    cadre = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rapports_hebdo_cadre')
    date_debut = models.DateField()
    date_fin = models.DateField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='maintenances')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Rapport {self.get_type_display()} - {self.cadre.username} ({self.date_debut} au {self.date_fin})"


class LigneRapportHebdoCadre(models.Model):
    rapport = models.ForeignKey(RapportHebdoCadre, on_delete=models.CASCADE, related_name='lignes')
    client = models.ForeignKey('Client', on_delete=models.CASCADE)
    nature_intervention = models.CharField(max_length=255)
    avancement_resultat = models.TextField()
    date_debut = models.DateField()
    date_fin = models.DateField()
    numero_ticket = models.CharField(max_length=100, blank=True)
    intervenant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lignes_hebdo')