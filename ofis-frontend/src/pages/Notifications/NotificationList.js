import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { FaBell, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerNotifications();
  }, []);

  const chargerNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const marquerLue = async (id) => {
    try {
      await api.markNotificationAsRead(id);
      chargerNotifications();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'depassement_heures':
        return <FaClock style={{ color: '#f59e0b' }} />;
      case 'depassement_delai':
        return <FaClock style={{ color: '#ef4444' }} />;
      case 'marge_critique':
        return <FaExclamationTriangle style={{ color: '#ef4444' }} />;
      default:
        return <FaBell style={{ color: '#3b82f6' }} />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'depassement_heures':
        return 'Dépassement d\'heures';
      case 'depassement_delai':
        return 'Dépassement de délai';
      case 'marge_critique':
        return 'Marge critique (<15%)';
      default:
        return 'Information';
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1><FaBell /> Notifications</h1>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {notifications.length === 0 ? (
          <Card><p>Aucune notification.</p></Card>
        ) : (
          notifications.map(notif => (
            <Card 
              key={notif.id} 
              style={{ 
                backgroundColor: notif.est_lue ? '#f9fafb' : '#eff6ff',
                borderLeft: `4px solid ${notif.est_lue ? '#9ca3af' : '#3b82f6'}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {getIcon(notif.type)}
                  <div>
                    <h3 style={{ margin: 0 }}>{getTypeLabel(notif.type)}</h3>
                    <p style={{ margin: '0.25rem 0' }}><strong>Projet:</strong> {notif.projet_name}</p>
                    <p style={{ margin: '0.25rem 0', color: '#666' }}>{notif.message}</p>
                    <small style={{ color: '#999' }}>
                      {new Date(notif.created_at).toLocaleString()}
                    </small>
                  </div>
                </div>
                {!notif.est_lue && (
                  <Button size="small" variant="outline" onClick={() => marquerLue(notif.id)}>
                    <FaCheckCircle /> Marquer comme lue
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationList;