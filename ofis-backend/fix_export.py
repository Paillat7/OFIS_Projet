import json

# Lire le fichier exporté
with open('export_clean.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Supprimer les champs problématiques
for obj in data:
    if obj['model'] == 'api.technician':
        # Supprimer les champs qui n'existent pas dans le modèle Neon
        obj['fields'].pop('commentaire', None)
        # Si d'autres champs posent problème, les ajouter ici
        # obj['fields'].pop('statut_actuel', None)  # par exemple

# Écrire le fichier corrigé
with open('export_fixed.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"✅ Fichier corrigé : export_fixed.json")
print(f"📊 Nombre d'objets : {len(data)}")