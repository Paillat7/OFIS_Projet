import os
import json
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.apps import apps
from django.core.serializers import serialize

# Modèles à exclure
EXCLUDED = ['auth.permission', 'contenttypes.contenttype', 'sessions.session']

# Modèles à exporter
INCLUDED = [
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
    # 'api.agendatechnicien',  # si présent
]

data = []

for model_name in INCLUDED:
    try:
        app_label, model_short = model_name.split('.')
        model = apps.get_model(app_label, model_short)
    except LookupError:
        print(f"⚠️ {model_name} ignoré (non trouvé)")
        continue

    queryset = model.objects.all()
    if not queryset.exists():
        print(f"📭 {model_name} : vide")
        continue

    # Sérialisation avec clés naturelles
    serialized = serialize('json', queryset, use_natural_foreign_keys=True, use_natural_primary_keys=True)
    objects = json.loads(serialized)

    # Nettoyer les champs problématiques
    for obj in objects:
        if obj['model'] == 'api.technician':
            # Supprimer les champs qui peuvent être null et poser problème
            obj['fields'].pop('commentaire', None)
            obj['fields'].pop('statut_actuel', None)
            # Ajoutez ici d'autres champs à supprimer si besoin

    data.extend(objects)
    print(f"✅ {model_name} : {queryset.count()} objets")

# Écrire le fichier JSON
with open('final_clean.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\n🎉 Exportation terminée : {len(data)} objets.")
print("📁 Fichier : final_clean.json")