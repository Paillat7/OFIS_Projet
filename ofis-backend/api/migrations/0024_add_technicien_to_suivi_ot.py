from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0023_merge_20260322_1641'),   # dernier numéro de migration
    ]

    operations = [
        migrations.AddField(
            model_name='suiviot',
            name='technicien',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='suivis_ot', to='auth.user'),
            preserve_default=False,
        ),
    ]