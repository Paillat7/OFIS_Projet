import os
import json
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.apps import apps
from django.core.serializers import serialize
from api.models import Technician
from django.contrib.auth.models import User

# Patch natural_key pour Technician
def technician_natural_key(self):
    return (self.user.username,)
Technician.natural_key = technician_natural_key

# Patch natural_key pour User (si besoin)
def user_natural_key(self):
    return (self.username,)
User.natural_key = user_natural_key

data = []
# Exporter d'abord les utilisateurs (auth.user) et autres modèles de base
models_to_export = [
    'auth.user',
    'auth.group',
    'auth.permission',
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
    'api.agendatechnicien'
]

for model_name in models_to_export:
    try:
        app_label, model_name_short = model_name.split('.')
        model = apps.get_model(app_label, model_name_short)
        queryset = model.objects.all()
        if queryset.exists():
            serialized = serialize('json', queryset, use_natural_foreign_keys=True, use_natural_primary_keys=True)
            data.extend(json.loads(serialized))
            print(f"Exported {queryset.count()} objects from {model_name}")
    except LookupError:
        print(f"Model {model_name} not found")

with open('final_export.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"✅ Exportation terminée : {len(data)} objets.")