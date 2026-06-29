import os
import json
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.apps import apps
from django.core.serializers import serialize

# Modèles à exporter (sans auth.permission)
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
]

data = []

for model_name in MODELS_TO_EXPORT:
    app_label, model_short = model_name.split('.')
    model = apps.get_model(app_label, model_short)
    queryset = model.objects.all()
    if not queryset.exists():
        print(f"Model {model_name}: empty")
        continue

    # Sérialiser avec clés naturelles
    serialized = serialize('json', queryset, use_natural_foreign_keys=True, use_natural_primary_keys=True)
    objects = json.loads(serialized)

    # Corriger les champs problématiques
    for obj in objects:
        if obj['model'] == 'api.technician':
            fields = obj['fields']
            # commentaire est NOT NULL → le mettre à '' si null
            if fields.get('commentaire') is None:
                fields['commentaire'] = ''
            # user_id est une clé étrangère, si null on le laisse (mais normalement non)
            # On peut aussi forcer le 'statut_actuel' à une valeur par défaut
            if not fields.get('statut_actuel'):
                fields['statut_actuel'] = 'disponible'

        # D'autres corrections si besoin (ex: api.ordretravail...)

    data.extend(objects)
    print(f"Exported {queryset.count()} objects from {model_name}")

with open('final_fixed_export.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"✅ Exportation terminée : {len(data)} objets.")