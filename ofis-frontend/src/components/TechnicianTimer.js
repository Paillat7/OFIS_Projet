// components/TechnicianTimer.js (ton code actuel - ne change rien)
import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import Card from './common/Card';
import Button from './common/Button';
import './TechnicianTimer.css';

const TechnicianTimer = ({ missionId, onSessionUpdate }) => {
  const [status, setStatus] = useState('idle');
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [pauseTime, setPauseTime] = useState(null);
  const [totalPaused, setTotalPaused] = useState(0);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  
  const { isConnected, sendMessage, notifications } = useWebSocket();
  const locationIntervalRef = useRef(null);

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Géolocalisation non supportée');
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed
          });
        },
        (error) => {
          let message = 'Erreur de géolocalisation';
          if (error.code === 1) message = 'Permission refusée';
          if (error.code === 2) message = 'Position indisponible';
          if (error.code === 3) message = 'Délai dépassé';
          reject(message);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const sendLocationUpdate = async () => {
    try {
      console.log('📍 Tentative d\'envoi de position...');
      const pos = await getCurrentPosition();
      setLocation(pos);
      
      let battery = null;
      if ('getBattery' in navigator) {
        const batteryObj = await navigator.getBattery();
        battery = batteryObj.level * 100;
      }
      
      const success = sendMessage({
        type: 'location_update',
        mission_id: missionId || 1,
        latitude: pos.latitude,
        longitude: pos.longitude,
        accuracy: pos.accuracy,
        battery: battery,
        timestamp: new Date().toISOString()
      });
      
      if (success) {
        console.log('✅ Position envoyée:', pos);
        alert(`📍 Position envoyée!\nLat: ${pos.latitude.toFixed(6)}\nLng: ${pos.longitude.toFixed(6)}`);
      } else {
        alert('❌ WebSocket non connecté');
      }
    } catch (error) {
      console.error('Erreur envoi position:', error);
      setLocationError(error);
      alert(`❌ ${error}`);
    }
  };

  const handleStart = async () => {
    try {
      setLocationError(null);
      const pos = await getCurrentPosition();
      
      setLocation(pos);
      setStartTime(new Date());
      setStatus('running');
      setDuration(0);
      setTotalPaused(0);
      
      sendMessage({
        type: 'start_mission',
        mission_id: missionId || 1,
        latitude: pos.latitude,
        longitude: pos.longitude,
        accuracy: pos.accuracy,
        timestamp: new Date().toISOString()
      });
      
      if (onSessionUpdate) {
        onSessionUpdate({ status: 'started', timestamp: new Date() });
      }
    } catch (error) {
      setLocationError(error);
      alert(`❌ ${error}`);
    }
  };

  const handlePause = () => {
    setPauseTime(new Date());
    setStatus('paused');
    
    sendMessage({
      type: 'pause_mission',
      mission_id: missionId || 1,
      timestamp: new Date().toISOString()
    });
  };

  const handleResume = () => {
    if (pauseTime) {
      const pausedDuration = (new Date() - pauseTime) / 1000;
      setTotalPaused(prev => prev + pausedDuration);
      setPauseTime(null);
    }
    setStatus('running');
    
    sendMessage({
      type: 'resume_mission',
      mission_id: missionId || 1,
      timestamp: new Date().toISOString()
    });
  };

  const handleEnd = async () => {
    try {
      const pos = await getCurrentPosition();
      
      sendMessage({
        type: 'end_mission',
        mission_id: missionId || 1,
        total_duration: duration,
        latitude: pos.latitude,
        longitude: pos.longitude,
        timestamp: new Date().toISOString()
      });
      
      setStatus('idle');
      setDuration(0);
      setStartTime(null);
      setPauseTime(null);
      setTotalPaused(0);
      setLocation(null);
      
      if (onSessionUpdate) {
        onSessionUpdate({ status: 'completed', duration });
      }
    } catch (error) {
      sendMessage({
        type: 'end_mission',
        mission_id: missionId || 1,
        total_duration: duration,
        timestamp: new Date().toISOString()
      });
      
      setStatus('idle');
      setDuration(0);
    }
  };

  useEffect(() => {
    let interval;
    if (status === 'running' && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = (now - startTime) / 1000;
        setDuration(Math.max(0, elapsed - totalPaused));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, startTime, totalPaused]);

  useEffect(() => {
    if (status === 'running') {
      const sendLocation = async () => {
        try {
          const pos = await getCurrentPosition();
          setLocation(pos);
          
          let battery = null;
          if ('getBattery' in navigator) {
            const batteryObj = await navigator.getBattery();
            battery = batteryObj.level * 100;
          }
          
          sendMessage({
            type: 'location_update',
            mission_id: missionId || 1,
            latitude: pos.latitude,
            longitude: pos.longitude,
            accuracy: pos.accuracy,
            battery: battery,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Erreur envoi auto:', error);
        }
      };
      
      sendLocation();
      locationIntervalRef.current = setInterval(sendLocation, 30000);
    }
    
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [status, missionId, sendMessage]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="technician-timer">
      <div className="timer-header">
        <h3>⏱️ Chronomètre de mission</h3>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connecté' : '🔴 Déconnecté'}
        </div>
      </div>

      <div className="timer-display">
        <div className="timer">{formatTime(duration)}</div>
        <div className="status-badge">
          {status === 'running' && '⏳ En cours'}
          {status === 'paused' && '⏸️ En pause'}
          {status === 'idle' && '⚪ En attente'}
        </div>
      </div>

      <div className="timer-controls">
        {status === 'idle' && (
          <>
            <Button onClick={handleStart} variant="primary">
              🟢 Démarrer
            </Button>
            <Button onClick={sendLocationUpdate} variant="outline">
              📡 Tester GPS
            </Button>
          </>
        )}
        
        {status === 'running' && (
          <>
            <Button onClick={handlePause} variant="outline">
              ⏸️ Pause
            </Button>
            <Button onClick={handleEnd} variant="danger">
              ⏹️ Terminer
            </Button>
            <Button onClick={sendLocationUpdate} variant="outline" size="small">
              📍 Envoyer position
            </Button>
          </>
        )}
        
        {status === 'paused' && (
          <>
            <Button onClick={handleResume} variant="primary">
              ▶️ Reprendre
            </Button>
            <Button onClick={handleEnd} variant="danger">
              ⏹️ Terminer
            </Button>
            <Button onClick={sendLocationUpdate} variant="outline" size="small">
              📍 Envoyer position
            </Button>
          </>
        )}
      </div>

      {location && (
        <div className="location-info">
          <strong>📍 Dernière position:</strong><br />
          Lat: {location.latitude.toFixed(6)}<br />
          Lng: {location.longitude.toFixed(6)}<br />
          🎯 ±{location.accuracy?.toFixed(1)}m
        </div>
      )}

      {locationError && (
        <div className="location-error">
          ⚠️ {locationError}
        </div>
      )}

      {!isConnected && (
        <div className="connection-warning">
          ⚠️ WebSocket déconnecté - Les positions ne seront pas transmises
        </div>
      )}
    </Card>
  );
};

export default TechnicianTimer;