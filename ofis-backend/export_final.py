import os
import json
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.apps import apps
from django.core.serializers import serialize

# Liste des modèles à exporter (exclure auth.permission et contenttypes)
MODELS_TO_EXPORT = [
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
    'api.agendatechnicien'
]

data = []
for model_name in MODELS_TO_EXPORT:
    try:
        model = apps.get_model(model_name.split('.')[0], model_name.split('.')[1])
        queryset = model.objects.all()
        if queryset.exists():
            serialized = serialize('json', queryset, use_natural_foreign_keys=True, use_natural_primary_keys=True)
            data.extend(json.loads(serialized))
            print(f"Exported {len(queryset)} objects from {model_name}")
        else:
            print(f"Model {model_name}: empty")
    except LookupError:
        print(f"Model {model_name} not found")

with open('final_export_no_perms.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"✅ Exportation terminée : {len(data)} objets.")