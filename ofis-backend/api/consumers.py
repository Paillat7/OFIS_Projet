# api/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import AccessToken

class TechnicianConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Récupérer le token depuis l'URL
        query_string = self.scope['query_string'].decode()
        params = parse_qs(query_string)
        token = params.get('token', [None])[0]
        
        print(f"🔌 Nouvelle connexion - Token reçu: {token[:20] if token else 'Aucun'}...")
        
        if not token:
            print("❌ Pas de token")
            await self.close()
            return

        # Valider le token et récupérer l'utilisateur
        user = await self.get_user_from_token(token)
        if not user:
            print("❌ Token invalide")
            await self.close()
            return

        self.user = user
        print(f"✅ Utilisateur authentifié: {user.username}")
        
        # Vérifier si c'est un admin (basé sur le chemin ou les permissions)
        path = self.scope['path']
        is_admin = 'admin' in path or user.is_staff or user.is_superuser
        
        if is_admin:
            # Admin rejoint le groupe des admins
            await self.channel_layer.group_add('admins', self.channel_name)
            print(f"👑 Admin connecté: {user.username}")
        else:
            # Technicien rejoint son groupe personnel
            self.technician_group = f'technician_{user.id}'
            await self.channel_layer.group_add(self.technician_group, self.channel_name)
            print(f"🔧 Technicien connecté: {user.username}")
        
        await self.accept()
        print(f"✅ WebSocket accepté pour {user.username}")

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            access_token = AccessToken(token)
            user = User.objects.get(id=access_token['user_id'])
            return user
        except Exception as e:
            print(f"❌ Erreur token: {e}")
            return None

    async def disconnect(self, close_code):
        if hasattr(self, 'user'):
            print(f"❌ Déconnexion de {self.user.username} - Code: {close_code}")
        else:
            print(f"❌ Déconnexion - Code: {close_code}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            print(f"📩 Message reçu de {self.user.username}: {message_type}")
            
            if message_type == 'location_update':
                # Le technicien envoie sa position
                await self.channel_layer.group_send(
                    'admins',
                    {
                        'type': 'technician_location',
                        'technician_id': self.user.id,
                        'technician_name': self.user.username,
                        'mission_id': data.get('mission_id', 1),
                        'latitude': data['latitude'],
                        'longitude': data['longitude'],
                        'accuracy': data.get('accuracy', 0),
                        'battery': data.get('battery'),
                        'timestamp': data.get('timestamp'),
                        'status': 'active'
                    }
                )
                print(f"📍 Position envoyée aux admins par {self.user.username}")
                
                # Confirmation au technicien
                await self.send(text_data=json.dumps({
                    'type': 'location_confirmed',
                    'message': 'Position reçue',
                    'timestamp': data.get('timestamp')
                }))

            elif message_type == 'start_mission':
                await self.channel_layer.group_send(
                    'admins',
                    {
                        'type': 'technician_status',
                        'technician_id': self.user.id,
                        'technician_name': self.user.username,
                        'status': 'active',
                        'timestamp': data.get('timestamp')
                    }
                )

            elif message_type == 'pause_mission':
                await self.channel_layer.group_send(
                    'admins',
                    {
                        'type': 'technician_status',
                        'technician_id': self.user.id,
                        'technician_name': self.user.username,
                        'status': 'pause',
                        'timestamp': data.get('timestamp')
                    }
                )

            elif message_type == 'end_mission':
                await self.channel_layer.group_send(
                    'admins',
                    {
                        'type': 'technician_status',
                        'technician_id': self.user.id,
                        'technician_name': self.user.username,
                        'status': 'completed',
                        'duration': data.get('total_duration'),
                        'timestamp': data.get('timestamp')
                    }
                )

        except Exception as e:
            print(f"❌ Erreur dans receive: {e}")

    async def technician_location(self, event):
        """Envoie la position aux admins connectés"""
        try:
            await self.send(text_data=json.dumps({
                'type': 'technician_location',
                'technician_id': event['technician_id'],
                'technician_name': event['technician_name'],
                'mission_id': event['mission_id'],
                'latitude': event['latitude'],
                'longitude': event['longitude'],
                'accuracy': event.get('accuracy'),
                'battery': event.get('battery'),
                'last_update': event.get('timestamp'),
                'status': event.get('status', 'active')
            }))
            print(f"🗺️ Position envoyée à admin")
        except Exception as e:
            print(f"❌ Erreur envoi position: {e}")

    async def technician_status(self, event):
        """Envoie le statut aux admins connectés"""
        try:
            await self.send(text_data=json.dumps({
                'type': f"session_{event['status']}",
                'technician_id': event['technician_id'],
                'technician_name': event['technician_name'],
                'timestamp': event.get('timestamp'),
                'duration': event.get('duration')
            }))
            print(f"🔄 Statut envoyé à admin: {event['status']}")
        except Exception as e:
            print(f"❌ Erreur envoi statut: {e}")