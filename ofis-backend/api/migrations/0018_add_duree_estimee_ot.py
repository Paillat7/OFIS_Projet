from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0017_suivi_ot'),  # ou le dernier numéro, à adapter
    ]

    operations = [
        migrations.AddField(
            model_name='ordretravail',
            name='duree_estimee',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='Durée estimée en heures', max_digits=6, null=True),
        ),
    ]