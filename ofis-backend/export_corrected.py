import sqlite3
import os

DB_PATH = "db.sqlite3"  # ou "nouvelle_base.db" selon votre fichier
OUTPUT = "import_final_corrected.sql"

def escape_sql(value):
    if value is None:
        return 'NULL'
    if isinstance(value, (int, float, bool)):
        return str(value).lower() if isinstance(value, bool) else str(value)
    if isinstance(value, str):
        return "'" + value.replace("'", "''") + "'"
    return "'" + str(value).replace("'", "''") + "'"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Récupérer les tables (uniquement celles qui commencent par 'api_' ou 'auth_')
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row[0] for row in cursor.fetchall() if row[0].startswith(('api_', 'auth_'))]

sql_lines = []

for table in tables:
    # Récupérer les colonnes avec des noms en minuscules
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [col[1].lower() for col in cursor.fetchall()]   # <--- conversion en minuscules
    columns_str = ', '.join(columns)

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