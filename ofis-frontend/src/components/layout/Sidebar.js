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
  FaTicketAlt,
  FaMoneyBill,
  FaCalendarAlt
} from 'react-icons/fa';
import './Layout.css';

const Sidebar = ({ userRole = 'technicien' }) => {
  // ===== MENUS PRINCIPAUX =====
  const menuItems = [
    // ✅ DASHBOARD visible par TOUS les rôles (technicien, cadre, manager, admin)
    { path: '/dashboard', icon: <FaTachometerAlt />, label: 'DASHBOARD', roles: ['technicien', 'cadre', 'manager', 'admin'] },
    { path: '/ot-en-cours', icon: <FaTasks />, label: 'OT EN COURS', roles: ['technicien', 'manager', 'admin'] },
    { path: '/ot-clotures', icon: <FaArchive />, label: 'OT CLOTURES', roles: ['manager', 'admin'] },
    { path: '/validation-ot', icon: <FaCheckCircle />, label: 'OT A VALIDER', roles: ['manager', 'admin'] },
    { path: '/rapports/journalier', icon: <FaFileAlt />, label: 'RAPPORTS JOURNALIERS', roles: ['technicien', 'manager', 'admin', 'cadre'] },
    { path: '/rapports-hebdo-cadre', icon: <FaCalendarWeek />, label: 'RAPPORTS HEBDOMADAIRES', roles: ['cadre', 'manager', 'admin'] },
    { path: '/projets', icon: <FaProjectDiagram />, label: 'PROJETS', roles: ['cadre', 'manager', 'admin'] },
    { path: '/clients', icon: <FaBuilding />, label: 'CLIENTS', roles: ['manager', 'admin'] },
    { path: '/tickets', icon: <FaTicketAlt />, label: 'TICKETS', roles: ['technicien', 'manager', 'admin', 'assistant'] },
    { path: '/notifications', icon: <FaBell />, label: 'NOTIFICATIONS', roles: ['manager', 'admin', 'cadre'] },
  ];

  // ===== SOUS-MENUS GESTION TECHNICIENS =====
  const technicienSubMenu = [
    { path: '/techniciens/taux-horaires', icon: <FaMoneyBill />, label: 'Taux horaires', roles: ['manager', 'admin'] },
    { path: '/techniciens/agenda', icon: <FaCalendarAlt />, label: 'Agenda', roles: ['manager', 'admin', 'technicien', 'cadre'] },
  ];

  // Filtrer les menus selon le rôle
  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));
  const showTechnicienSubMenu = technicienSubMenu.some(item => item.roles.includes(userRole));

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {filteredItems.map((item) => {
          // Masquer l'ancien lien "TECHNICIENS" (remplacé par les sous-menus)
          if (item.path === '/techniciens') return null;
          return (
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
          );
        })}

        {/* ===== SOUS-MENUS GESTION TECHNICIENS ===== */}
        {showTechnicienSubMenu && (
          <div className="nav-section">
            <div className="nav-section-title">GESTION TECHNICIENS</div>
            {technicienSubMenu
              .filter(item => item.roles.includes(userRole))
              .map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                    `nav-link sub-nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              ))}
          </div>
        )}
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