import json

# Lire le fichier exporté
with open('export_fixed.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Parcourir les objets et supprimer les champs problématiques
for obj in data:
    if obj['model'] == 'api.technician':
        obj['fields'].pop('commentaire', None)
        obj['fields'].pop('statut_actuel', None)

# Écrire le fichier nettoyé
with open('export_cleaned.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("✅ Champs 'commentaire' et 'statut_actuel' supprimés pour api.technician.")