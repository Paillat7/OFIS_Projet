import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.apps import apps
from django.core.serializers import serialize
import json

# Modèles à exporter (sauf ceux qui posent problème)
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
    'api.agendatechnicien',  # si présent
]

data = []

for model_name in MODELS_TO_EXPORT:
    try:
        app_label, model_short = model_name.split('.')
        model = apps.get_model(app_label, model_short)
    except LookupError:
        print(f"⚠️ Modèle {model_name} non trouvé, ignoré.")
        continue

    queryset = model.objects.all()
    if not queryset.exists():
        print(f"📭 {model_name} : vide")
        continue

    # Sérialisation avec clés naturelles et gestion des relations
    serialized = serialize('json', queryset, use_natural_foreign_keys=True, use_natural_primary_keys=True)
    objects = json.loads(serialized)

    # Nettoyer les champs problématiques (ex: commentaire NULL)
    for obj in objects:
        if obj['model'] == 'api.technician':
            fields = obj['fields']
            if fields.get('commentaire') is None:
                fields['commentaire'] = ''
            if fields.get('statut_actuel') is None:
                fields['statut_actuel'] = 'disponible'
        # Autres corrections si besoin

    data.extend(objects)
    print(f"✅ {model_name} : {queryset.count()} objets")

# Écrire le fichier JSON avec encodage UTF-8 et sans BOM
with open('export_clean.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\n🎉 Exportation terminée : {len(data)} objets.")
print(f"📁 Fichier : export_clean.json")