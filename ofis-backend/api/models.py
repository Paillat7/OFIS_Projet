from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# ===== 1. SOUS-SERVICES =====
class SousService(models.Model):
    SERVICE_PARENT_CHOICES = [
        ('OSN', 'OSN'),
        ('OBT', 'OBT'),
    ]
    nom = models.CharField(max_length=100)
    service_parent = models.CharField(max_length=20, choices=SERVICE_PARENT_CHOICES)

    def __str__(self):
        return f"{self.service_parent} - {self.nom}"


# ===== 2. PROFIL TECHNICIEN =====
class Technician(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='technician_profile')
    sous_services = models.ManyToManyField(SousService, blank=True, related_name='techniciens')
    phone = models.CharField(max_length=20, blank=True)
    hire_date = models.DateField(null=True, blank=True)
    taux_horaire = models.DecimalField(max_digits=10, decimal_places=0, null=True, blank=True, help_text="Taux horaire en FCFA")

    def __str__(self):
        services = ", ".join([str(ss) for ss in self.sous_services.all()])
        return f"{self.user.username} - {services}"


# ===== 3. CLIENTS =====
class Client(models.Model):
    firstName = models.CharField(max_length=100)
    lastName = models.CharField(max_length=100)
    company = models.CharField(max_length=200, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.firstName} {self.lastName} - {self.company}"


# ===== 4. ORDRES DE TRAVAIL =====
class OrdreTravail(models.Model):
    STATUT_CHOICES = [
        ('planifie', 'Planifié'),
        ('en_cours', 'En cours'),
        ('termine', 'Terminé'),
    ]
    VALIDATION_CHOICES = [
        ('en_attente', 'En attente'),
        ('valide', 'Validé'),
        ('rejete', 'Rejeté'),
    ]

    reference = models.CharField(max_length=50, unique=True, help_text="Numéro OT (saisie manuelle)")
    reference_externe = models.CharField(max_length=50, blank=True, help_text="Référence bon de commande client")
    objet = models.CharField(max_length=255, blank=True)
    lieu = models.CharField(max_length=255, blank=True)
    
    client_rapport = models.ForeignKey(Client, on_delete=models.CASCADE)
    techniciens = models.ManyToManyField(User, related_name='ordres_travail', blank=True)
    
    estimation_heures = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    date_creation = models.DateTimeField(auto_now_add=True)
    date_debut = models.DateTimeField(null=True, blank=True)
    date_fin = models.DateTimeField(null=True, blank=True)
    date_validation = models.DateTimeField(null=True, blank=True)
    date_archivage = models.DateTimeField(null=True, blank=True)
    
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='planifie')
    statut_validation = models.CharField(max_length=20, choices=VALIDATION_CHOICES, default='en_attente')
    valide_par = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ot_valides')

    technicien = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='ordres_travail_anciens')
    parent_ot = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='sous_ots')

    @property
    def heures_consommees(self):
        total = self.suivis.aggregate(total=models.Sum('heures'))['total'] or 0
        return float(total)

    @property
    def avancement(self):
        if not self.estimation_heures or self.estimation_heures == 0:
            return 0
        return min(100, int((self.heures_consommees / float(self.estimation_heures)) * 100))

    def __str__(self):
        return f"{self.reference} - {self.objet}"


# ===== 5. RAPPORT JOURNALIER =====
class RapportJournalier(models.Model):
    technicien = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rapports_journaliers')
    date = models.DateField(auto_now_add=True)
    sous_service = models.ForeignKey('SousService', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('technicien', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.technicien.username} - {self.date}"


# ===== 6. LIGNE DU RAPPORT JOURNALIER =====
class LigneRapportJournalier(models.Model):
    rapport = models.ForeignKey(RapportJournalier, on_delete=models.CASCADE, related_name='lignes')
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    ot = models.ForeignKey(OrdreTravail, on_delete=models.SET_NULL, null=True, blank=True)
    nature_intervention = models.CharField(max_length=255)
    description = models.TextField()
    avancement_resultat = models.TextField(blank=True)
    date_debut = models.TimeField(null=True, blank=True)
    date_fin = models.TimeField(null=True, blank=True)
    duree = models.DecimalField(max_digits=5, decimal_places=2)
    numero_ticket = models.CharField(max_length=100, blank=True)
    rit_signe = models.BooleanField(default=False)
    pv_signe = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date_debut']

    def __str__(self):
        return f"{self.rapport.date} - {self.client.company} - {self.duree}h"


# ===== 7. RAPPORTS HEBDOMADAIRES CADRE =====
class RapportHebdoCadre(models.Model):
    TYPE_CHOICES = [
        ('av', 'Avant-Vente'),
        ('projets', 'Projets'),
        ('maintenances', 'Maintenances / Interventions'),
        ('autres', 'Autres'),
    ]

    cadre = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rapports_hebdo_cadre')
    sous_service = models.ForeignKey('SousService', on_delete=models.SET_NULL, null=True, blank=True)
    date_debut = models.DateField()
    date_fin = models.DateField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='maintenances')
    
    resume = models.TextField(blank=True)
    actions_notables = models.TextField(blank=True)
    difficultes = models.TextField(blank=True)
    perspectives = models.TextField(blank=True)
    
    nb_interventions = models.IntegerField(default=0)
    heures_total = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    
    tickets = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Rapport {self.cadre.username} - {self.date_debut}"


# ===== 8. SUIVI OT =====
class SuiviOT(models.Model):
    ot = models.ForeignKey(OrdreTravail, on_delete=models.CASCADE, related_name='suivis')
    technicien = models.ForeignKey(User, on_delete=models.CASCADE, related_name='suivis_ot')
    date = models.DateField()
    heures = models.DecimalField(max_digits=5, decimal_places=2)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('ot', 'technicien', 'date')


# ===== 9. DOCUMENTS OT =====
class DocumentOT(models.Model):
    TYPE_CHOICES = [
        ('photo', 'Photo (travail effectué)'),
        ('screenshot', 'Capture écran / Email'),
        ('pdf', 'PDF reçu / Document'),
        ('cr', 'Compte rendu de réunion'),
        ('autre', 'Autre'),
    ]
    ot = models.ForeignKey(OrdreTravail, on_delete=models.CASCADE, related_name='documents')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    fichier = models.FileField(upload_to='ot_documents/')
    nom = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)


# ===== 10. PROJETS =====
class Projet(models.Model):
    STATUT_CHOICES = [
        ('en_cours', 'En cours'),
        ('termine', 'Terminé'),
        ('suspendu', 'Suspendu'),
    ]
    
    DEVISE_CHOICES = [
        ('XAF', 'Franc CFA (CEMAC) - XAF'),
        ('XOF', 'Franc CFA (UEMOA) - XOF'),
        ('ZAR', 'Rand - ZAR (Afrique du Sud)'),
        ('MAD', 'Dirham - MAD (Maroc)'),
        ('EGP', 'Livre - EGP (Égypte)'),
        ('NGN', 'Naira - NGN (Nigéria)'),
        ('EUR', 'Euro - EUR'),
        ('GBP', 'Livre Sterling - GBP'),
        ('CHF', 'Franc Suisse - CHF'),
        ('USD', 'Dollar US - USD'),
        ('CAD', 'Dollar Canadien - CAD'),
        ('BRL', 'Real - BRL (Brésil)'),
        ('MXN', 'Peso - MXN (Mexique)'),
        ('JPY', 'Yen - JPY (Japon)'),
        ('CNY', 'Yuan - CNY (Chine)'),
        ('INR', 'Roupie - INR (Inde)'),
        ('KRW', 'Won - KRW (Corée du Sud)'),
        ('THB', 'Baht - THB (Thaïlande)'),
        ('SGD', 'Dollar - SGD (Singapour)'),
        ('MYR', 'Ringgit - MYR (Malaisie)'),
        ('IDR', 'Roupie - IDR (Indonésie)'),
        ('PHP', 'Peso - PHP (Philippines)'),
        ('VND', 'Dong - VND (Vietnam)'),
        ('AED', 'Dirham - AED (EAU)'),
        ('SAR', 'Riyal - SAR (Arabie Saoudite)'),
        ('QAR', 'Riyal - QAR (Qatar)'),
        ('KWD', 'Dinar - KWD (Koweït)'),
        ('BHD', 'Dinar - BHD (Bahreïn)'),
        ('AUD', 'Dollar Australien - AUD'),
        ('NZD', 'Dollar Néo-Zélandais - NZD'),
    ]
    
    nom = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    chef_projet = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projets_diriges')
    estimation_heures = models.DecimalField(max_digits=8, decimal_places=2)
    date_debut = models.DateField()
    date_fin = models.DateField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_cours')
    intervenants = models.ManyToManyField(User, related_name='projets_intervenants', blank=True)
    
    cout_projet = models.DecimalField(max_digits=15, decimal_places=0, null=True, blank=True)
    devise_cout = models.CharField(max_length=10, choices=DEVISE_CHOICES, default='XAF')
    benefice_attendu = models.DecimalField(max_digits=15, decimal_places=0, null=True, blank=True)
    devise_benefice = models.CharField(max_length=10, choices=DEVISE_CHOICES, default='XAF')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.nom

    @property
    def heures_consommees(self):
        from django.db.models import Sum
        total = self.heures.aggregate(total=Sum('heures'))['total'] or 0
        return float(total)

    @property
    def heures_restantes(self):
        reste = float(self.estimation_heures) - self.heures_consommees
        return max(0, reste)

    @property
    def avancement(self):
        if self.estimation_heures == 0:
            return 0
        return min(100, int((self.heures_consommees / float(self.estimation_heures)) * 100))
    
    @property
    def statut_couleur(self):
        if self.heures_consommees <= self.estimation_heures:
            return 'vert'
        return 'rouge'


class HeureProjet(models.Model):
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name='heures')
    intervenant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='heures_projet')
    date = models.DateField()
    heure_debut = models.TimeField(null=True, blank=True)
    heure_fin = models.TimeField(null=True, blank=True)
    heures = models.DecimalField(max_digits=5, decimal_places=2)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.projet.nom} - {self.intervenant.username} - {self.heures}h"


# ===== 11. NOTIFICATIONS =====
class Notification(models.Model):
    TYPE_CHOICES = [
        ('depassement_heures', 'Dépassement d\'heures'),
        ('depassement_delai', 'Dépassement de délai'),
        ('marge_critique', 'Marge critique (<15%)'),
        ('projet_termine', 'Projet terminé'),
    ]
    
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    message = models.TextField()
    est_lue = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.projet.nom} - {self.get_type_display()}"

# ===== 12. TICKETS / INCIDENTS =====
class Ticket(models.Model):
    STATUT_CHOICES = [
        ('nouveau', 'Nouveau'),
        ('en_cours', 'En cours'),
        ('resolu', 'Résolu'),
        ('ferme', 'Fermé'),
    ]
    
    PRIORITE_CHOICES = [
        ('basse', 'Basse'),
        ('moyenne', 'Moyenne'),
        ('haute', 'Haute'),
        ('critique', 'Critique'),
    ]
    
    numero = models.IntegerField(unique=True, blank=True, null=True, editable=False, verbose_name="N° Ticket")
    titre = models.CharField(max_length=255)
    description = models.TextField()
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='tickets')
    technicien_assigne = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets_assigne')
    cree_par = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='tickets_crees')
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='nouveau')
    priorite = models.CharField(max_length=20, choices=PRIORITE_CHOICES, default='moyenne')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    date_resolution = models.DateTimeField(null=True, blank=True)
    date_fermeture = models.DateTimeField(null=True, blank=True)
    temps_passe = models.DecimalField(max_digits=6, decimal_places=2, default=0, help_text="Temps passé en heures")
    solution = models.TextField(blank=True, help_text="Solution apportée")
    commentaires = models.TextField(blank=True, help_text="Commentaires internes")
    
    class Meta:
        ordering = ['-date_creation']
    
    def save(self, *args, **kwargs):
        if not self.numero:
            dernier = Ticket.objects.all().order_by('-numero').first()
            if dernier and dernier.numero:
                self.numero = dernier.numero + 1
            else:
                self.numero = 2321  # Démarre à 2321
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"N°{self.numero} - {self.titre}"
    
    @property
    def temps_en_heures(self):
        return float(self.temps_passe)
    
    @property
    def est_resolu(self):
        return self.statut in ['resolu', 'ferme']


# ===== 13. HISTORIQUE DES TICKETS =====
class TicketHistorique(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='historique')
    utilisateur = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=255)
    details = models.TextField(blank=True)
    date_action = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date_action']
    
    def __str__(self):
        return f"{self.ticket.numero} - {self.action} - {self.utilisateur.username}"