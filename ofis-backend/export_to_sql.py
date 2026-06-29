import os
import django
from django.db import connection

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.apps import apps

# Modèles à exporter (ordre par dépendance)
MODELS = [
    'auth.user',
    'auth.group',
    'api.sousservice',
    'api.technician',
    'api.client',
    'api.ordretravail',
    'api.documentot',
    'api.suiviot',
    'api.rapportjournalier',
    'api.lignerapportjournalier',
    'api.rapporthebdocadre',
    'api.projet',
    'api.heureprojet',
    'api.ticket',
    'api.tickethistorique',
    'api.notification',
]

def get_fields(model):
    """Récupère les champs du modèle (exclut les clés étrangères ManyToMany et les OneToOneField)"""
    fields = []
    for f in model._meta.get_fields():
        if f.auto_created or f.is_relation and f.many_to_many:
            continue
        if f.name in ['password', 'last_login', 'date_joined', 'is_active', 'is_staff', 'is_superuser']:
            continue  # on laisse Django les gérer ou on les inclut mais il faut les valeurs
        fields.append(f)
    return fields

def escape_sql(value):
    if value is None:
        return 'NULL'
    if isinstance(value, bool):
        return 'true' if value else 'false'
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, (str,)):
        # Échapper les apostrophes
        return "'" + value.replace("'", "''") + "'"
    if isinstance(value, (datetime, date, time)):
        return "'" + value.isoformat() + "'"
    if isinstance(value, decimal.Decimal):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"

from datetime import datetime, date, time
import decimal

sql_lines = []
for model_name in MODELS:
    app_label, model_short = model_name.split('.')
    model = apps.get_model(app_label, model_short)
    table = model._meta.db_table
    fields = get_fields(model)
    field_names = [f.column for f in fields]  # utilise le nom de colonne réel
    field_names_str = ', '.join(field_names)

    queryset = model.objects.all()
    if not queryset.exists():
        continue

    for obj in queryset:
        values = []
        for f in fields:
            val = getattr(obj, f.name, None)
            if isinstance(val, (datetime, date, time)):
                val = val.isoformat()
            elif isinstance(val, decimal.Decimal):
                val = str(val)
            values.append(escape_sql(val))
        values_str = ', '.join(values)
        sql_lines.append(f"INSERT INTO {table} ({field_names_str}) VALUES ({values_str});")

# Écrire le fichier SQL
with open('import.sql', 'w', encoding='utf-8') as f:
    f.write("BEGIN;\n")
    f.write("\n".join(sql_lines))
    f.write("\nCOMMIT;\n")

print(f"✅ Fichier import.sql généré avec {len(sql_lines)} insertions.")