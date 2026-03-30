from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0015_rapportprojetcadre'),
    ]

    operations = [
        migrations.CreateModel(
            name='RapportHebdoCadre',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date_debut', models.DateField()),
                ('date_fin', models.DateField()),
                ('type', models.CharField(choices=[('av', 'Avant-Vente'), ('projets', 'Projets'), ('maintenances', 'Maintenances / Interventions'), ('autres', 'Autres')], default='maintenances', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('cadre', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='rapports_hebdo_cadre', to='auth.user')),
            ],
        ),
        migrations.CreateModel(
            name='LigneRapportHebdoCadre',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nature_intervention', models.CharField(max_length=255)),
                ('avancement_resultat', models.TextField()),
                ('date_debut', models.DateField()),
                ('date_fin', models.DateField()),
                ('numero_ticket', models.CharField(blank=True, max_length=100)),
                ('client', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.client')),
                ('intervenant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lignes_hebdo', to='auth.user')),
                ('rapport', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lignes', to='api.rapporthebdocadre')),
            ],
        ),
    ]