from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source='actor.username', read_only=True)
    target_url = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'actor_username', 'verb', 'target_object_id', 'timestamp', 'is_read', 'team', 'target_url']

    def get_target_url(self, obj):
        if obj.target and hasattr(obj.target, 'get_absolute_url'):
            return obj.target.get_absolute_url()
        return None