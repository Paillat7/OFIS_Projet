from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0023_merge_20260322_1641'),  # dépendance de la dernière migration
    ]

    operations = [
        # Étape 1 : ajout du champ en nullable temporairement
        migrations.AddField(
            model_name='suiviot',
            name='technicien',
            field=models.ForeignKey(
                to='auth.User',  # <- la clé étrangère doit pointer vers le modèle User
                on_delete=django.db.models.deletion.CASCADE,
                related_name='suivis_ot',
                null=True,       # temporairement nullable
            ),
        ),
        # Étape 2 : mettre à jour les lignes existantes
        # (si la table est vide, cette opération ne fait rien)
        migrations.RunSQL(
            sql=(
                "UPDATE api_suiviot SET technicien_id = "
                "(SELECT id FROM auth_user WHERE username = 'admin' LIMIT 1)"
            ),
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Étape 3 : rendre le champ non-null
        migrations.AlterField(
            model_name='suiviot',
            name='technicien',
            field=models.ForeignKey(
                to='auth.User',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='suivis_ot',
                null=False,
            ),
        ),
    ]