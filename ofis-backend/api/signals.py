# api/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import Group, User
from .models import Report  # Remplace par le bon modèle si nécessaire
from notifications.models import Notification

@receiver(post_save, sender=Report)
def notify_on_report_creation(sender, instance, created, **kwargs):
    if created:
        # Récupérer le groupe "assistante" (à créer si besoin)
        try:
            assistante_group = Group.objects.get(name='assistante')
            recipients = assistante_group.user_set.all()
        except Group.DoesNotExist:
            # Si le groupe n'existe pas, on ne fait rien (ou on peut notifier les admins)
            recipients = User.objects.filter(is_staff=True)  # fallback : admins

        # Créer une notification pour chaque destinataire
        for user in recipients:
            Notification.objects.create(
                recipient=user,
                actor=instance.author,  # champ contenant l'auteur du rapport (technicien)
                verb="a déposé un nouveau rapport",
                target=instance,
                team=instance.team if hasattr(instance, 'team') else ''  # si le rapport a une équipe
            )