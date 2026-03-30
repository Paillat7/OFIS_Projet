import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import NotificationBell from './NotificationBell';
import './Layout.css';

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/dashboard" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src="/images/ofis-logo.png" 
            alt="OFIS" 
            style={{ height: '35px' }} 
          />
          <div>
            <span className="logo-text">OFIS</span>
            <span className="logo-subtitle">Suivi des missions</span>
          </div>
        </Link>
      </div>

      <div className="header-right">
        <NotificationBell />
        <div className="user-menu">
          <div className="user-avatar">
            <FaUser />
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'Utilisateur'}</span>
            <span className="user-role">{user?.role || 'Employé'}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;