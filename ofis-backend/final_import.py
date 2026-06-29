import os
import sys
import json
import subprocess
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.db import connection

# 1. Exporter depuis SQLite (sans DATABASE_URL)
print("🔄 Exportation depuis SQLite...")
cmd = [
    sys.executable, "manage.py", "dumpdata",
    "--natural-foreign", "--natural-primary",
    "--exclude", "auth.permission",
    "--exclude", "contenttypes",
    "--exclude", "sessions",
    "--output", "data_final.json"
]
subprocess.run(cmd, check=True)
print("✅ Exportation terminée.")

# 2. Nettoyer le fichier JSON
print("🔄 Nettoyage du fichier JSON...")
with open("data_final.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for obj in data:
    if obj['model'] == 'api.technician':
        fields = obj['fields']
        # Supprimer les champs qui n'existent pas ou posent problème
        fields.pop('commentaire', None)
        fields.pop('statut_actuel', None)
        # Assurer que 'user' est bien une clé naturelle
        # Si 'user' est un nombre, le laisser, mais il doit correspondre à un user existant

with open("data_clean.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"✅ Nettoyage terminé : {len(data)} objets.")

# 3. Importer dans Neon (avec DATABASE_URL déjà défini)
print("🔄 Importation dans Neon...")
# Vider la base Neon avant l'import (pour éviter les conflits)
with connection.cursor() as cursor:
    cursor.execute("SET session_replication_role = replica;")
    # Truncate des tables (ordre inverse des dépendances)
    cursor.execute("TRUNCATE api_agendatechnicien, api_notification, api_tickethistorique, api_ticket, api_heureprojet, api_projet_intervenants, api_projet, api_rapporthebdocadre, api_lignerapportjournalier, api_rapportjournalier, api_suiviot, api_documentot, api_ordretravail_techniciens, api_ordretravail, api_client, api_technician_sous_services, api_technician, api_sousservice, auth_user_groups, auth_user_user_permissions, auth_group_permissions, auth_group, auth_user RESTART IDENTITY CASCADE;")
    cursor.execute("SET session_replication_role = DEFAULT;")

# Importer
cmd = [
    sys.executable, "manage.py", "loaddata", "data_clean.json"
]
subprocess.run(cmd, check=True)
print("✅ Importation terminée.")

print("🎉 Migration terminée avec succès !")