import sqlite3
import sys

DB_PATH = "db.sqlite3"  # ou "nouvelle_base.db" selon votre fichier
OUTPUT = "import_clean_final.sql"

def escape_sql(value):
    if value is None:
        return 'NULL'
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, str):
        # Échapper les guillemets simples
        return "'" + value.replace("'", "''") + "'"
    # Pour les dates, les transformer en chaîne ISO
    return "'" + str(value).replace("'", "''") + "'"

conn = sqlite3.connect(DB_PATH)
conn.text_factory = str  # éviter les problèmes d'encodage
cursor = conn.cursor()

# Récupérer les tables (uniquement celles de l'application 'api' et 'auth' mais on exclut les tables système)
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
all_tables = [row[0] for row in cursor.fetchall()]

# Filtrer : on prend api_* et auth_user, auth_group, mais on exclut auth_permission, auth_user_user_permissions, auth_group_permissions, auth_user_groups, django_*
tables = []
for t in all_tables:
    if t.startswith('api_'):
        tables.append(t)
    elif t in ('auth_user', 'auth_group'):
        tables.append(t)
    # On ignore les autres (auth_permission, auth_user_user_permissions, etc.)

# Ordre d'importation pour respecter les clés étrangères (dépendances)
order = ['auth_user', 'auth_group', 'api_sousservice', 'api_technician', 'api_client', 'api_ordretravail', 'api_documentot', 'api_suiviot', 'api_rapportjournalier', 'api_lignerapportjournalier', 'api_rapporthebdocadre', 'api_projet', 'api_heureprojet', 'api_ticket', 'api_tickethistorique', 'api_notification', 'api_agendatechnicien', 'api_ordretravail_techniciens', 'api_projet_intervenants', 'api_technician_sous_services']
# On trie selon l'ordre, les tables non listées seront ignorées (ou mises à la fin)
ordered_tables = [t for t in order if t in tables]
# Ajouter les tables qui ne sont pas dans l'ordre (éventuellement)
for t in tables:
    if t not in ordered_tables:
        ordered_tables.append(t)

sql_lines = []
for table in ordered_tables:
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [col[1].lower() for col in cursor.fetchall()]  # minuscules
    columns_str = ', '.join(columns)

    cursor.execute(f"SELECT * FROM {table}")
    rows = cursor.fetchall()
    if not rows:
        continue

    for row in rows:
        values = [escape_sql(v) for v in row]
        values_str = ', '.join(values)
        sql_lines.append(f"INSERT INTO {table} ({columns_str}) VALUES ({values_str});")

with open(OUTPUT, 'w', encoding='utf-8') as f:
    f.write("BEGIN;\n")
    f.write("\n".join(sql_lines))
    f.write("\nCOMMIT;\n")

print(f"✅ {len(sql_lines)} insertions écrites dans {OUTPUT}")
conn.close()