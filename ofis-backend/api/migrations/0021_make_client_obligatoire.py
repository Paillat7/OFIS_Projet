from django.db import migrations, models
import django.db.models.deletion

def create_default_client(apps, schema_editor):
    Client = apps.get_model('api', 'Client')
    OrdreTravail = apps.get_model('api', 'OrdreTravail')
    
    # Crée un client par défaut (modifiez les valeurs selon vos besoins)
    default_client, created = Client.objects.get_or_create(
        firstName='Client',
        lastName='Défaut',
        email='default@ofis.com',
        phone='0000000000',
        address='Adresse par défaut'
    )
    # Assigne ce client à tous les OT qui n'en ont pas
    OrdreTravail.objects.filter(client_rapport__isnull=True).update(client_rapport=default_client)

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0020_auto_rapportprojet'),
    ]

    operations = [
        migrations.RunPython(create_default_client),
        migrations.AlterField(
            model_name='ordretravail',
            name='client_rapport',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.client'),
        ),
    ]