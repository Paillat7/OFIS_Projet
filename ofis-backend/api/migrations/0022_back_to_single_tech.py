from django.db import migrations, models
import django.db.models.deletion

def transfer_techniciens_to_technicien(apps, schema_editor):
    OrdreTravail = apps.get_model('api', 'OrdreTravail')
    for ot in OrdreTravail.objects.all():
        # Prendre le premier technicien de la liste ManyToMany (s'il y en a)
        first_tech = ot.techniciens.first()
        if first_tech:
            ot.technicien = first_tech
            ot.save()
        else:
            # S'il n'y a aucun technicien, on assigne un technicien par défaut (ex: user_id=1)
            # Adaptez selon votre base (par exemple un admin)
            default_user_id = 1
            ot.technicien_id = default_user_id
            ot.save()

def create_default_client(apps, schema_editor):
    Client = apps.get_model('api', 'Client')
    OrdreTravail = apps.get_model('api', 'OrdreTravail')
    default_client, created = Client.objects.get_or_create(
        firstName='Client',
        lastName='Défaut',
        email='default@ofis.com',
        phone='0000000000',
        address='Adresse par défaut'
    )
    OrdreTravail.objects.filter(client_rapport__isnull=True).update(client_rapport=default_client)

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0019_merge_20260322_1457'),   # ← à adapter au dernier numéro
    ]

    operations = [
        # 1. Ajouter le champ technicien (ForeignKey) temporairement nullable
        migrations.AddField(
            model_name='ordretravail',
            name='technicien',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='ordres_travail', to='auth.user'),
        ),
        # 2. Transférer les données de l'ancienne table ManyToMany
        migrations.RunPython(transfer_techniciens_to_technicien),
        # 3. Supprimer l'ancienne relation ManyToMany
        migrations.RemoveField(
            model_name='ordretravail',
            name='techniciens',
        ),
        # 4. Rendre technicien non nullable
        migrations.AlterField(
            model_name='ordretravail',
            name='technicien',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ordres_travail', to='auth.user'),
        ),
        # 5. Ajouter un client par défaut et rendre client_rapport obligatoire
        migrations.RunPython(create_default_client),
        migrations.AlterField(
            model_name='ordretravail',
            name='client_rapport',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.client'),
        ),
    ]