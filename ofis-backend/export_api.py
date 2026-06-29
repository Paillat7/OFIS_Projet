import os
import json
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.apps import apps
from django.core.serializers import serialize

# Récupérer tous les modèles de l'application 'api'
api_models = [model for model in apps.get_models() if model._meta.app_label == 'api']

data = []
for model in api_models:
    queryset = model.objects.all()
    if queryset.exists():
        serialized = serialize('json', queryset, use_natural_foreign_keys=True, use_natural_primary_keys=True)
        data.extend(json.loads(serialized))

# Écrire le fichier JSON avec encodage UTF-8
with open('api_export.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"✅ Exportation terminée : {len(data)} objets de l'application 'api'.")