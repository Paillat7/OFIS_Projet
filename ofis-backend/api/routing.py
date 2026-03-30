# api/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Les techniciens se connectent ici
    re_path(r'ws/technician/$', consumers.TechnicianConsumer.as_asgi()),
    
    # Les admins se connectent ici
    re_path(r'ws/admin/$', consumers.TechnicianConsumer.as_asgi()),
]