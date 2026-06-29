import os
import json
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.apps import apps
from django.core.serializers import serialize

data = []
for model in apps.get_models():
    # Exclure admin.LogEntry
    if model._meta.app_label == 'admin' and model._meta.model_name == 'logentry':
        continue
    queryset = model.objects.all()
    if queryset.exists():
        serialized = serialize('json', queryset, use_natural_foreign_keys=True, use_natural_primary_keys=True)
        data.extend(json.loads(serialized))

with open('full_export_final.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"✅ Exportation terminée : {len(data)} objets")