import os
import json
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.apps import apps
from django.core.serializers import serialize

# Exporter toutes les données avec clés naturelles
data = []
for model in apps.get_models():
    queryset = model.objects.all()
    if queryset.exists():
        serialized = serialize('json', queryset, use_natural_foreign_keys=True, use_natural_primary_keys=True)
        data.extend(json.loads(serialized))

# Écrire le fichier JSON
with open('full_export_final.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"✅ Exportation terminée : {len(data)} objets")