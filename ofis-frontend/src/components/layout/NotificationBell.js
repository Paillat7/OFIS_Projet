import React, { useState, useEffect, useRef } from 'react';
import { FaBell } from 'react-icons/fa';
import { Link } from 'react-router-dom'; // ← import pour les liens
import { getNotifications, markAsRead, getUnreadCount } from '../../services/notificationService';
import './NotificationBell.css';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.unread_count);
    } catch (error) {
      console.error('Erreur compteur notifications', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data);
    } catch (error) {
      console.error('Erreur chargement notifications', error);
    }
  };

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) fetchNotifications();
  };

  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount(prev => prev - 1);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button className="header-btn notification-btn" onClick={handleBellClick}>
        <FaBell />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">Aucune notification</div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                >
                  <Link
                    to={notif.target_url || '#'}
                    className="notification-link"
                    style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}
                    onClick={() => setShowDropdown(false)} // ferme le dropdown après navigation
                  >
                    <div className="notification-content">
                      <strong>{notif.actor_username}</strong> {notif.verb}
                      <div className="notification-time">{formatDate(notif.timestamp)}</div>
                    </div>
                  </Link>
                  {!notif.is_read && (
                    <button
                      className="mark-read-btn"
                      onClick={() => handleMarkAsRead(notif.id)}
                      title="Marquer comme lu"
                    >
                      ✓
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;