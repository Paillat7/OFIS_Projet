// hooks/useWebSocket.js
import { useEffect, useRef, useState, useCallback } from 'react';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const wsRef = useRef(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('ofis_token');
    if (!token) {
      console.log('❌ Pas de token');
      return;
    }

    // Récupérer le nom d'utilisateur
    const userStr = localStorage.getItem('ofis_user');
    let username = '';
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        username = user.username?.toLowerCase() || '';
      } catch (e) {
        console.error('Erreur parsing user:', e);
      }
    }

    console.log(`🔄 Simulation WebSocket pour ${username}...`);
    
    // Simuler une connexion réussie
    setTimeout(() => {
      console.log('✅ WebSocket simulé connecté');
      setIsConnected(true);
      
      // Si c'est l'admin (tresor), recevoir des positions toutes les 5 secondes
      if (username === 'tresor') {
        const interval = setInterval(() => {
          const fakePosition = {
            type: 'technician_location',
            technician_id: 1,
            technician_name: 'Jaurdy',
            latitude: -4.769 + (Math.random() - 0.5) * 0.02,
            longitude: 11.866 + (Math.random() - 0.5) * 0.02,
            accuracy: 10 + Math.random() * 20,
            status: 'active',
            last_update: new Date().toISOString()
          };
          setLastMessage(fakePosition);
          console.log('📩 Position simulée reçue:', fakePosition);
        }, 5000);
        
        wsRef.current = { close: () => clearInterval(interval) };
      } else {
        // Pour le technicien, juste un objet vide
        wsRef.current = { close: () => {} };
      }
    }, 1000);

  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current && wsRef.current.close) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data) => {
    console.log('📤 Message simulé envoyé:', data);
    
    // Simuler une confirmation pour le technicien
    setTimeout(() => {
      setLastMessage({
        type: 'location_confirmed',
        message: 'Position reçue par le serveur',
        timestamp: new Date().toISOString()
      });
    }, 500);
    
    return true;
  }, []);

  return {
    isConnected,
    lastMessage,
    notifications,
    sendMessage
  };
};