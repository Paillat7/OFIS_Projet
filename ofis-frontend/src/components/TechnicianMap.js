// components/TechnicianMap.js
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Card from './common/Card';

// Configuration des icônes
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createTechnicianIcon = (status) => {
  const color = status === 'active' ? '#10b981' : '#f59e0b';
  
  return L.divIcon({
    className: 'technician-marker',
    html: `<div style="
      background-color: ${color};
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
    ">
      ${status === 'active' ? '▶️' : '⏸️'}
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

const TechnicianMap = ({ activeSessions, technicians }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  // Initialiser la carte
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      console.log('🗺️ Initialisation de la carte');
      
      mapInstanceRef.current = L.map(mapRef.current).setView([-4.769, 11.866], 12);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        console.log('🗺️ Nettoyage de la carte');
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = {};
      }
    };
  }, []);

  // Mettre à jour les marqueurs
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    console.log('📍 Mise à jour des marqueurs:', activeSessions);

    // Supprimer les anciens marqueurs
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Ajouter les nouveaux marqueurs
    Object.entries(activeSessions).forEach(([techId, session]) => {
      if (!session.latitude || !session.longitude) return;

      const technician = technicians.find(t => t.id === parseInt(techId));
      const name = session.technician_name || 
                  (technician?.user?.first_name || 'Tech') + 
                  ' ' + (technician?.user?.last_name || techId);

      const marker = L.marker([session.latitude, session.longitude], {
        icon: createTechnicianIcon(session.status || 'active')
      }).addTo(mapInstanceRef.current);

      marker.bindPopup(`
        <div style="min-width: 200px;">
          <h4 style="margin:0 0 8px 0;">${name}</h4>
          <p><strong>Lat:</strong> ${session.latitude.toFixed(6)}</p>
          <p><strong>Lng:</strong> ${session.longitude.toFixed(6)}</p>
          ${session.accuracy ? `<p><strong>Précision:</strong> ±${session.accuracy.toFixed(1)}m</p>` : ''}
          <p style="font-size:0.8rem; color:#666;">
            ${session.last_update ? new Date(session.last_update).toLocaleTimeString() : ''}
          </p>
        </div>
      `);

      markersRef.current[techId] = marker;
    });

  }, [activeSessions, technicians]);

  return (
    <Card title="🗺️ Carte des techniciens">
      <div 
        ref={mapRef} 
        style={{ 
          height: '500px', 
          width: '100%', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }} 
      />
    </Card>
  );
};

export default TechnicianMap;