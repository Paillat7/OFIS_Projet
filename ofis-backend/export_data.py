import os
import json
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.apps import apps
from django.core.serializers import serialize

# Récupérer tous les modèles de l'application 'api'
models = [m for m in apps.get_models() if m._meta.app_label == 'api']

# Exporter les données en JSON
data = []
for model in models:
    queryset = model.objects.all()
    if queryset.exists():
        serialized = serialize('json', queryset, use_natural_foreign_keys=True)
        data.extend(json.loads(serialized))

# Ajouter les modèles d'authentification (auth.user, auth.group, etc.)
auth_models = ['User', 'Group', 'Permission']
for model_name in auth_models:
    try:
        model = apps.get_model('auth', model_name)
        queryset = model.objects.all()
        if queryset.exists():
            serialized = serialize('json', queryset)
            data.extend(json.loads(serialized))
    except LookupError:
        pass

# Écrire le fichier JSON
with open('full_data_export.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Exportation terminée : {len(data)} objets.")