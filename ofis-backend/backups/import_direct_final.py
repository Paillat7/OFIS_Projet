import os
import django
from django.db import transaction
from django.apps import apps

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

# ===== Récupération des modèles via apps =====
def get_model(name):
    try:
        return apps.get_model('api', name)
    except LookupError:
        print(f"⚠️ Modèle {name} non trouvé, ignoré.")
        return None

def get_auth_model(name):
    try:
        return apps.get_model('auth', name)
    except LookupError:
        print(f"⚠️ Modèle auth.{name} non trouvé, ignoré.")
        return None

User = get_auth_model('User')
Group = get_auth_model('Group')
SousService = get_model('SousService')
Technician = get_model('Technician')
Client = get_model('Client')
OrdreTravail = get_model('OrdreTravail')
DocumentOT = get_model('DocumentOT')
SuiviOT = get_model('SuiviOT')
RapportJournalier = get_model('RapportJournalier')
LigneRapportJournalier = get_model('LigneRapportJournalier')
RapportHebdoCadre = get_model('RapportHebdoCadre')
Projet = get_model('Projet')
HeureProjet = get_model('HeureProjet')
Ticket = get_model('Ticket')
TicketHistorique = get_model('TicketHistorique')
Notification = get_model('Notification')
AgendaTechnicien = get_model('AgendaTechnicien')  # si présent

# ===== Connexion SQLite =====
import sqlite3
SQLITE_PATH = "db.sqlite3"  # ou "nouvelle_base.db"
conn_sqlite = sqlite3.connect(SQLITE_PATH)
conn_sqlite.row_factory = sqlite3.Row

# ===== Maps pour les clés étrangères =====
id_maps = {
    'auth_user': {},
    'auth_group': {},
    'api_sousservice': {},
    'api_client': {},
    'api_technician': {},
    'api_ordretravail': {},
    'api_projet': {},
    'api_ticket': {},
}

def get_or_create_user(row):
    """Crée ou récupère un utilisateur à partir des données SQLite."""
    user_id = row['id']
    if user_id in id_maps['auth_user']:
        return id_maps['auth_user'][user_id]
    user, created = User.objects.get_or_create(
        id=user_id,
        defaults={
            'username': row['username'],
            'email': row['email'] or '',
            'first_name': row['first_name'] or '',
            'last_name': row['last_name'] or '',
            'is_active': bool(row['is_active']),
            'is_staff': bool(row['is_staff']),
            'is_superuser': bool(row['is_superuser']),
            'password': row['password'],
            'date_joined': row['date_joined'],
            'last_login': row['last_login'] if row['last_login'] else None,
        }
    )
    id_maps['auth_user'][user_id] = user
    return user

@transaction.atomic
def import_data():
    print("🔄 Début de l'importation...")

    # 1. Utilisateurs
    if User:
        cursor = conn_sqlite.execute("SELECT * FROM auth_user")
        users = cursor.fetchall()
        for row in users:
            get_or_create_user(row)
        print(f"✅ {len(users)} utilisateurs importés")
    else:
        print("❌ Modèle User non disponible, saut.")

    # 2. Groupes
    if Group:
        cursor = conn_sqlite.execute("SELECT * FROM auth_group")
        groups = cursor.fetchall()
        for row in groups:
            group, created = Group.objects.get_or_create(
                id=row['id'],
                defaults={'name': row['name']}
            )
            id_maps['auth_group'][row['id']] = group
        print(f"✅ {len(groups)} groupes importés")

    # 3. Sous-services
    if SousService:
        cursor = conn_sqlite.execute("SELECT * FROM api_sousservice")
        items = cursor.fetchall()
        for row in items:
            obj, created = SousService.objects.get_or_create(
                id=row['id'],
                defaults={
                    'nom': row['nom'],
                    'service_parent': row['service_parent'],
                }
            )
            id_maps['api_sousservice'][row['id']] = obj
        print(f"✅ {len(items)} sous-services importés")

    # 4. Clients
    if Client:
        cursor = conn_sqlite.execute("SELECT * FROM api_client")
        items = cursor.fetchall()
        for row in items:
            client, created = Client.objects.get_or_create(
                id=row['id'],
                defaults={
                    'firstName': row['firstName'],
                    'lastName': row['lastName'],
                    'company': row['company'] or '',
                    'email': row['email'] or '',
                    'phone': row['phone'] or '',
                    'address': row['address'] or '',
                    'createdAt': row['createdAt'],
                    'is_active': bool(row['is_active']),
                }
            )
            id_maps['api_client'][row['id']] = client
        print(f"✅ {len(items)} clients importés")

    # 5. Techniciens
    if Technician:
        cursor = conn_sqlite.execute("SELECT * FROM api_technician")
        items = cursor.fetchall()
        for row in items:
            user = get_or_create_user(dict(row))
            tech, created = Technician.objects.get_or_create(
                id=row['id'],
                defaults={
                    'user': user,
                    'phone': row['phone'] or '',
                    'hire_date': row['hire_date'] if row['hire_date'] else None,
                    'taux_horaire': row['taux_horaire'],
                    'statut_actuel': row['statut_actuel'] or 'disponible',
                    'commentaire': row['commentaire'] or '',
                    'date_debut': row['date_debut'] if row['date_debut'] else None,
                    'date_fin': row['date_fin'] if row['date_fin'] else None,
                }
            )
            id_maps['api_technician'][row['id']] = tech
            # ManyToMany: sous-services
            cursor2 = conn_sqlite.execute(
                "SELECT sousservice_id FROM api_technician_sous_services WHERE technician_id = ?", (row['id'],)
            )
            sous_ids = [r[0] for r in cursor2.fetchall()]
            if sous_ids:
                sous_services = SousService.objects.filter(id__in=sous_ids)
                tech.sous_services.set(sous_services)
        print(f"✅ {len(items)} techniciens importés")

    # 6. OT
    if OrdreTravail:
        cursor = conn_sqlite.execute("SELECT * FROM api_ordretravail")
        items = cursor.fetchall()
        for row in items:
            ot, created = OrdreTravail.objects.get_or_create(
                id=row['id'],
                defaults={
                    'reference': row['reference'],
                    'reference_externe': row['reference_externe'] or '',
                    'objet': row['objet'] or '',
                    'lieu': row['lieu'] or '',
                    'client_rapport': Client.objects.get(id=row['client_rapport_id']),
                    'estimation_heures': row['estimation_heures'],
                    'statut': row['statut'],
                    'statut_validation': row['statut_validation'],
                    'date_creation': row['date_creation'],
                    'date_debut': row['date_debut'] if row['date_debut'] else None,
                    'date_fin': row['date_fin'] if row['date_fin'] else None,
                    'date_validation': row['date_validation'] if row['date_validation'] else None,
                    'date_archivage': row['date_archivage'] if row['date_archivage'] else None,
                    'valide_par': User.objects.get(id=row['valide_par_id']) if row['valide_par_id'] else None,
                    'technicien': User.objects.get(id=row['technicien_id']) if row['technicien_id'] else None,
                    'parent_ot': OrdreTravail.objects.get(id=row['parent_ot_id']) if row['parent_ot_id'] else None,
                }
            )
            id_maps['api_ordretravail'][row['id']] = ot
            # ManyToMany: techniciens
            cursor2 = conn_sqlite.execute(
                "SELECT user_id FROM api_ordretravail_techniciens WHERE ordretravail_id = ?", (row['id'],)
            )
            user_ids = [r[0] for r in cursor2.fetchall()]
            if user_ids:
                users = User.objects.filter(id__in=user_ids)
                ot.techniciens.set(users)
        print(f"✅ {len(items)} ordres de travail importés")

    # 7. Suivis
    if SuiviOT:
        cursor = conn_sqlite.execute("SELECT * FROM api_suiviot")
        items = cursor.fetchall()
        for row in items:
            SuiviOT.objects.get_or_create(
                id=row['id'],
                defaults={
                    'ot': OrdreTravail.objects.get(id=row['ot_id']),
                    'technicien': User.objects.get(id=row['technicien_id']),
                    'date': row['date'],
                    'heures': row['heures'],
                    'description': row['description'] or '',
                }
            )
        print(f"✅ {len(items)} suivis importés")

    # 8. Documents OT
    if DocumentOT:
        cursor = conn_sqlite.execute("SELECT * FROM api_documentot")
        items = cursor.fetchall()
        for row in items:
            DocumentOT.objects.get_or_create(
                id=row['id'],
                defaults={
                    'ot': OrdreTravail.objects.get(id=row['ot_id']),
                    'type': row['type'],
                    'fichier': row['fichier'] or '',
                    'nom': row['nom'] or '',
                    'uploaded_at': row['uploaded_at'],
                }
            )
        print(f"✅ {len(items)} documents importés")

    # 9. Projets
    if Projet:
        cursor = conn_sqlite.execute("SELECT * FROM api_projet")
        items = cursor.fetchall()
        for row in items:
            projet, created = Projet.objects.get_or_create(
                id=row['id'],
                defaults={
                    'nom': row['nom'],
                    'description': row['description'] or '',
                    'chef_projet': User.objects.get(id=row['chef_projet_id']),
                    'estimation_heures': row['estimation_heures'],
                    'date_debut': row['date_debut'],
                    'date_fin': row['date_fin'] if row['date_fin'] else None,
                    'statut': row['statut'],
                    'cout_projet': row['cout_projet'],
                    'devise_cout': row['devise_cout'] or 'XAF',
                    'benefice_attendu': row['benefice_attendu'],
                    'devise_benefice': row['devise_benefice'] or 'XAF',
                }
            )
            id_maps['api_projet'][row['id']] = projet
            # ManyToMany: intervenants
            cursor2 = conn_sqlite.execute(
                "SELECT user_id FROM api_projet_intervenants WHERE projet_id = ?", (row['id'],)
            )
            user_ids = [r[0] for r in cursor2.fetchall()]
            if user_ids:
                users = User.objects.filter(id__in=user_ids)
                projet.intervenants.set(users)
        print(f"✅ {len(items)} projets importés")

    # 10. Heures projet
    if HeureProjet:
        cursor = conn_sqlite.execute("SELECT * FROM api_heureprojet")
        items = cursor.fetchall()
        for row in items:
            HeureProjet.objects.get_or_create(
                id=row['id'],
                defaults={
                    'projet': Projet.objects.get(id=row['projet_id']),
                    'intervenant': User.objects.get(id=row['intervenant_id']),
                    'date': row['date'],
                    'heures': row['heures'],
                    'description': row['description'] or '',
                    'heure_debut': row['heure_debut'] if row['heure_debut'] else None,
                    'heure_fin': row['heure_fin'] if row['heure_fin'] else None,
                }
            )
        print(f"✅ {len(items)} heures projet importés")

    # 11. Tickets
    if Ticket:
        cursor = conn_sqlite.execute("SELECT * FROM api_ticket")
        items = cursor.fetchall()
        for row in items:
            Ticket.objects.get_or_create(
                id=row['id'],
                defaults={
                    'numero': row['numero'],
                    'titre': row['titre'],
                    'description': row['description'] or '',
                    'client': Client.objects.get(id=row['client_id']),
                    'technicien_assigne': User.objects.get(id=row['technicien_assigne_id']) if row['technicien_assigne_id'] else None,
                    'cree_par': User.objects.get(id=row['cree_par_id']) if row['cree_par_id'] else None,
                    'statut': row['statut'],
                    'priorite': row['priorite'],
                    'date_creation': row['date_creation'],
                    'date_modification': row['date_modification'] if row['date_modification'] else None,
                    'date_resolution': row['date_resolution'] if row['date_resolution'] else None,
                    'date_fermeture': row['date_fermeture'] if row['date_fermeture'] else None,
                    'temps_passe': row['temps_passe'] or 0,
                    'solution': row['solution'] or '',
                    'commentaires': row['commentaires'] or '',
                }
            )
        print(f"✅ {len(items)} tickets importés")

    # 12. Historique tickets
    if TicketHistorique:
        cursor = conn_sqlite.execute("SELECT * FROM api_tickethistorique")
        items = cursor.fetchall()
        for row in items:
            TicketHistorique.objects.get_or_create(
                id=row['id'],
                defaults={
                    'ticket': Ticket.objects.get(id=row['ticket_id']),
                    'utilisateur': User.objects.get(id=row['utilisateur_id']),
                    'action': row['action'],
                    'details': row['details'] or '',
                    'date_action': row['date_action'],
                }
            )
        print(f"✅ {len(items)} historiques tickets importés")

    # 13. Notifications
    if Notification:
        cursor = conn_sqlite.execute("SELECT * FROM api_notification")
        items = cursor.fetchall()
        for row in items:
            Notification.objects.get_or_create(
                id=row['id'],
                defaults={
                    'projet': Projet.objects.get(id=row['projet_id']),
                    'type': row['type'],
                    'message': row['message'],
                    'est_lue': bool(row['est_lue']),
                    'created_at': row['created_at'],
                }
            )
        print(f"✅ {len(items)} notifications importés")

    # 14. Agenda (si le modèle existe)
    if AgendaTechnicien:
        cursor = conn_sqlite.execute("SELECT * FROM api_agendatechnicien")
        items = cursor.fetchall()
        for row in items:
            AgendaTechnicien.objects.get_or_create(
                id=row['id'],
                defaults={
                    'technicien': Technician.objects.get(id=row['technicien_id']),
                    'date': row['date'],
                    'heure_debut': row['heure_debut'],
                    'heure_fin': row['heure_fin'],
                    'statut': row['statut'],
                    'commentaire': row['commentaire'] or '',
                }
            )
        print(f"✅ {len(items)} agendas importés")
    else:
        print("ℹ️ Modèle AgendaTechnicien non trouvé, ignoré.")

    print("🎉 Importation terminée avec succès !")

if __name__ == "__main__":
    import_data()