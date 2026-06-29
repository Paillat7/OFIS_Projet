import re

# Lire le fichier avec l'encodage UTF-8
with open('import_final_clean.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Remplacer les séquences mal encodées (cas les plus fréquents)
replacements = {
    'â”œÂ®': 'é',
    'â”œÂ¿': 'è',
    'â”œÂ«': 'ê',
    'â”œÃ¡': 'à',
    'â”œÂ¹': 'ù',
    'â”œÂ´': 'ô',
    'â”œÂ®': 'ê',  # déjà
    'â”œÂº': 'ç',
    'â”œÂ®s': 'és',
    'â”œÂ¿re': 'ère',
    'â”œÂ®e': 'ée',
    'â”œÂ§': 'ï',
    'â”œÂ°': 'î',
    'â”œÂ»': 'û',
}
for old, new in replacements.items():
    content = content.replace(old, new)

# Écrire le fichier corrigé
with open('import_final_corrected_utf8.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fichier corrigé : import_final_corrected_utf8.sql")