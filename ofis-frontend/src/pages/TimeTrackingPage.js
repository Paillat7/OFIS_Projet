import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Card from '../components/common/Card';
import { useWebSocket } from '../hooks/useWebSocket';
import { authService } from '../services/authService';
import './Pages.css';

// Configuration des icônes
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createTechnicianIcon = () => {
  return L.divIcon({
    html: `<div style="
      background-color: #10b981;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      font-weight: bold;
    ">▶️</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30]
  });
};

const TimeTrackingPage = () => {
  const [user] = useState(authService.getCurrentUser());
  const [positions, setPositions] = useState([]);
  const { isConnected, lastMessage } = useWebSocket();

  const center = [-4.769, 11.866];
  const username = user?.username?.toLowerCase() || '';

  useEffect(() => {
    if (lastMessage?.type === 'technician_location') {
      setPositions(prev => {
        const newPos = {
          id: lastMessage.technician_id,
          lat: lastMessage.latitude,
          lng: lastMessage.longitude,
          name: lastMessage.technician_name,
          time: lastMessage.last_update
        };
        const index = prev.findIndex(p => p.id === newPos.id);
        if (index >= 0) {
          const newPrev = [...prev];
          newPrev[index] = newPos;
          return newPrev;
        }
        return [...prev, newPos];
      });
    }
  }, [lastMessage]);

  if (username === 'jaurdy') {
    return (
      <div className="dashboard-page">
        <div className="page-header">
          <h1>Tableau de bord technicien</h1>
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connecté' : '🔴 Déconnecté'}
          </div>
        </div>
        
        <Card>
          <h3>Interface technicien</h3>
          <p>Utilisateur: {user?.username}</p>
          <p>WebSocket: {isConnected ? 'Connecté' : 'Déconnecté'}</p>
          
          <button 
            onClick={() => {
              const fakePos = {
                latitude: -4.769 + (Math.random() - 0.5) * 0.02,
                longitude: 11.866 + (Math.random() - 0.5) * 0.02
              };
              console.log('📍 Envoi position:', fakePos);
              alert(`Position envoyée!\nLat: ${fakePos.latitude.toFixed(6)}\nLng: ${fakePos.longitude.toFixed(6)}`);
            }}
            style={{
              padding: '10px 20px',
              background: '#1E6FD9',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📍 Envoyer position test
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Suivi terrain - Admin</h1>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connecté' : '🔴 Déconnecté'}
        </div>
      </div>

      <Card title="🗺️ Techniciens en direct">
        <div style={{ height: '500px', width: '100%' }}>
          <MapContainer
            center={center}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            {positions.map((pos) => (
              <Marker
                key={pos.id}
                position={[pos.lat, pos.lng]}
                icon={createTechnicianIcon()}
              >
                <Popup>
                  <div>
                    <h4>{pos.name}</h4>
                    <p>Lat: {pos.lat.toFixed(6)}</p>
                    <p>Lng: {pos.lng.toFixed(6)}</p>
                    <p>{new Date(pos.time).toLocaleTimeString()}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </Card>

      <Card title="📋 Debug">
        <pre>{JSON.stringify(positions, null, 2)}</pre>
      </Card>
    </div>
  );
};

export default TimeTrackingPage;