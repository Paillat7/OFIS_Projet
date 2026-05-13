import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaBuilding, 
  FaTasks, 
  FaArchive, 
  FaFileAlt, 
  FaCalendarWeek, 
  FaCheckCircle,
  FaProjectDiagram,
  FaTachometerAlt,
  FaUser,
  FaBell,
  FaTicketAlt
} from 'react-icons/fa';
import './Layout.css';

const Sidebar = ({ userRole = 'technicien' }) => {
  const menuItems = [
    { path: '/dashboard', icon: <FaTachometerAlt />, label: 'DASHBOARD', roles: ['manager', 'admin'] },
    { path: '/ot-en-cours', icon: <FaTasks />, label: 'OT EN COURS', roles: ['technicien', 'manager', 'admin'] },
    { path: '/ot-clotures', icon: <FaArchive />, label: 'OT CLOTURES', roles: ['manager', 'admin'] },
    { path: '/validation-ot', icon: <FaCheckCircle />, label: 'OT A VALIDER', roles: ['manager', 'admin'] },
    { path: '/rapports/journalier', icon: <FaFileAlt />, label: 'RAPPORTS JOURNALIERS', roles: ['technicien', 'manager', 'admin', 'cadre'] },
    { path: '/rapports-hebdo-cadre', icon: <FaCalendarWeek />, label: 'RAPPORTS HEBDOMADAIRES', roles: ['cadre', 'manager', 'admin'] },
    { path: '/projets', icon: <FaProjectDiagram />, label: 'PROJETS', roles: ['cadre', 'manager', 'admin'] },
    { path: '/clients', icon: <FaBuilding />, label: 'CLIENTS', roles: ['manager', 'admin'] },
    { path: '/techniciens', icon: <FaUser />, label: 'TECHNICIENS', roles: ['manager', 'admin'] },
    { path: '/tickets', icon: <FaTicketAlt />, label: 'TICKETS', roles: ['technicien', 'manager', 'admin', 'assistant'] },
    { path: '/notifications', icon: <FaBell />, label: 'NOTIFICATIONS', roles: ['manager', 'admin', 'cadre'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="version-info">
          <span>OFIS v1.0</span>
          <small>© 2026</small>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;