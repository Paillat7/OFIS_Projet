from django.db import migrations, models
import django.utils.timezone

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0019_merge_20260322_1457'),
    ]

    operations = [
        # Renommer 'ingenieur' en 'cadre' (ancien modèle RapportProjet)
        migrations.RenameField(
            model_name='rapportprojet',
            old_name='ingenieur',
            new_name='cadre',
        ),
        # Renommer 'remarques' en 'observations'
        migrations.RenameField(
            model_name='rapportprojet',
            old_name='remarques',
            new_name='observations',
        ),
        # Ajouter 'created_at' avec une valeur par défaut pour les lignes existantes
        migrations.AddField(
            model_name='rapportprojet',
            name='created_at',
            field=models.DateTimeField(default=django.utils.timezone.now),
            preserve_default=False,
        ),
        # Ajouter 'updated_at' avec auto_now
        migrations.AddField(
            model_name='rapportprojet',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
    ]