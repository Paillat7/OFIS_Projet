with open('import_fixed.sql', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Grouper par 20 lignes (excepté BEGIN et COMMIT)
batch_size = 20
total = len(lines)
for i in range(0, total, batch_size):
    batch = lines[i:i+batch_size]
    with open(f'batch_{i//batch_size+1}.sql', 'w', encoding='utf-8') as f:
        f.write('BEGIN;\n')
        f.write(''.join(batch))
        if not batch[-1].strip().startswith('COMMIT'):
            f.write('COMMIT;\n')