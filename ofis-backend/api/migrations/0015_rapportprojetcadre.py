from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0014_add_service_to_rapportjournalier'),
    ]

    operations = [
        migrations.CreateModel(
            name='RapportProjetCadre',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom_projet', models.CharField(max_length=200)),
                ('avancement', models.IntegerField(help_text='Pourcentage réalisé (0-100)')),
                ('taches_realisees', models.TextField()),
                ('prochaines_taches', models.TextField()),
                ('remarques', models.TextField(blank=True)),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('date_modification', models.DateTimeField(auto_now=True)),
                ('cadre', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, related_name='rapports_projet_cadre')),
            ],
        ),
    ]