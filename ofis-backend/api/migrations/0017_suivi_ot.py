from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0016_rapporthebdocadre'),  # ← dernier numéro de migration
    ]

    operations = [
        migrations.CreateModel(
            name='SuiviOT',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('heures', models.DecimalField(decimal_places=2, help_text='Heures travaillées ce jour', max_digits=5)),
                ('description', models.TextField(blank=True, help_text='Description des tâches effectuées')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('ot', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='suivis', to='api.ordretravail')),
            ],
            options={
                'ordering': ['-date'],
                'unique_together': {('ot', 'date')},
            },
        ),
    ]