import os
import django
from django.db import connection, transaction

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

# Vérifier la base actuelle
print("Base actuelle :", connection.settings_dict['NAME'])

# Si ce n'est pas le chemin attendu, on force
# On ne fait rien, on suppose que db.sqlite3 est déjà la bonne base

# 1. Exporter les données en JSON
import subprocess
import sys
import json

print("🔄 Exportation des données depuis SQLite...")
cmd = [
    sys.executable, "manage.py", "dumpdata",
    "--exclude", "auth.permission",
    "--exclude", "contenttypes",
    "--exclude", "sessions",
    "--output", "data_import.json"
]
subprocess.run(cmd, check=True)
print("✅ Exportation terminée.")

# Vérifier que le fichier contient des données
with open("data_import.json", "r", encoding="utf-8") as f:
    data = json.load(f)
print(f"✅ {len(data)} objets exportés.")

if len(data) == 0:
    print("❌ Erreur : aucune donnée exportée. Vérifiez que db.sqlite3 contient bien les données.")
    sys.exit(1)

# 2. Importer dans Neon
# On suppose que DATABASE_URL est déjà défini
print("🔄 Importation dans Neon...")
cmd = [
    sys.executable, "manage.py", "loaddata", "data_import.json"
]
subprocess.run(cmd, check=True)
print("✅ Importation terminée.")