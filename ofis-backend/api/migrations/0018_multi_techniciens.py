from django.db import migrations, models
import django.db.models.deletion

def copy_technicien_to_techniciens(apps, schema_editor):
    OrdreTravail = apps.get_model('api', 'OrdreTravail')
    for ot in OrdreTravail.objects.all():
        # L'ancien champ 'technicien' existe encore avant sa suppression
        if ot.technicien:
            ot.techniciens.add(ot.technicien)

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0017_suivi_ot'),   # adapter si le dernier numéro est différent
    ]

    operations = [
        # 1. Ajouter le ManyToManyField techniciens
        migrations.AddField(
            model_name='ordretravail',
            name='techniciens',
            field=models.ManyToManyField(blank=True, related_name='ordres_travail', to='auth.User'),
        ),

        # 2. Copier les anciennes données
        migrations.RunPython(copy_technicien_to_techniciens),

        # 3. Supprimer l'ancien champ ForeignKey technicien
        migrations.RemoveField(
            model_name='ordretravail',
            name='technicien',
        ),

        # 4. Ajouter le champ technicien dans SuiviOT
        migrations.AddField(
            model_name='suiviot',
            name='technicien',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, related_name='suivis_ot', to='auth.User'),
            preserve_default=False,
        ),

        # 5. Modifier unique_together
        migrations.AlterUniqueTogether(
            name='suiviot',
            unique_together={('ot', 'technicien', 'date')},
        ),
    ]