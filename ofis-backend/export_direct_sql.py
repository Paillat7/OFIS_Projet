import sqlite3
import json
import os

DB_PATH = "db.sqlite3"  # ou "nouvelle_base.db" selon votre fichier
OUTPUT = "import.sql"

def escape_sql(value):
    if value is None:
        return 'NULL'
    if isinstance(value, (int, float, bool)):
        return str(value).lower() if isinstance(value, bool) else str(value)
    if isinstance(value, str):
        # Échapper les apostrophes
        return "'" + value.replace("'", "''") + "'"
    # Pour les dates et autres, on les convertit en chaîne
    return "'" + str(value).replace("'", "''") + "'"

# Connexion à la base SQLite
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Récupérer la liste des tables (exclure les tables système)
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
tables = [row[0] for row in cursor.fetchall()]

# Filtrer les tables à exporter (celles qui commencent par 'api_' ou 'auth_')
allowed_tables = [t for t in tables if t.startswith(('api_', 'auth_'))]

sql_lines = []

for table in allowed_tables:
    # Récupérer les colonnes
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [col[1] for col in cursor.fetchall()]
    columns_str = ', '.join(columns)

    # Récupérer les données
    cursor.execute(f"SELECT * FROM {table}")
    rows = cursor.fetchall()

    if not rows:
        continue

    for row in rows:
        values = [escape_sql(v) for v in row]
        values_str = ', '.join(values)
        sql_lines.append(f"INSERT INTO {table} ({columns_str}) VALUES ({values_str});")

# Écrire le fichier SQL
with open(OUTPUT, 'w', encoding='utf-8') as f:
    f.write("BEGIN;\n")
    f.write("\n".join(sql_lines))
    f.write("\nCOMMIT;\n")

print(f"✅ {len(sql_lines)} insertions écrites dans {OUTPUT}")
conn.close()