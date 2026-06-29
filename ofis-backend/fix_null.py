import re

with open('import.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Remplacer NULL par '' pour les colonnes textes (sans toucher aux nombres)
content = re.sub(r',\s*NULL\s*,', ", '', ", content)  # NULL entre virgules
content = re.sub(r',\s*NULL\s*\)', ", '')", content)  # NULL en fin de ligne

with open('import_fixed.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fichier corrigé : import_fixed.sql")