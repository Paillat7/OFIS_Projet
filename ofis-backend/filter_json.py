import json

with open('data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Modèles à conserver (y compris les sous-services)
allowed_models = [
    'auth.user',
    'auth.group',
    'api.sousservice',          # ← indispensable pour les clés étrangères des techniciens
    'api.client',
    'api.technician',
    'api.ordretravail',
    'api.suiviot',
    'api.documentot',
    'api.projet',
    'api.heureprojet',
    'api.ticket',
    'api.tickethistorique',
    'api.rapportjournalier',
    'api.lignerapportjournalier',
    'api.rapporthebdocadre',
    'notifications.notification'
]

filtered = [obj for obj in data if obj['model'] in allowed_models]

with open('data_filtered.json', 'w', encoding='utf-8') as f:
    json.dump(filtered, f, indent=2, ensure_ascii=False)

print(f"✅ data_filtered.json créé avec {len(filtered)} objets")