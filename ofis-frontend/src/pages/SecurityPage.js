import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { 
  FaArrowLeft, FaShieldAlt, FaHistory, FaUserShield,
  FaLock, FaExclamationTriangle, FaEye, FaDownload,
  FaSearch, FaFilter, FaCalendarAlt, FaCheck,
  FaTimes, FaGlobe, FaMobile, FaDesktop
} from 'react-icons/fa';

const SecurityPage = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('logs');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    passwordRequireNumber: true,
    passwordRequireUpper: true,
    ipWhitelist: '',
    maintenanceMode: false,
    httpsRequired: true,
  });

  // Charger les logs simulés
  useEffect(() => {
    loadLogs();
  }, [dateRange]);

  const loadLogs = () => {
    setLoading(true);
    // Simuler le chargement des logs
    setTimeout(() => {
      const mockLogs = [
        {
          id: 1,
          user: 'admin@ofis.com',
          action: 'CONNEXION',
          status: 'succès',
          ip: '192.168.1.100',
          device: 'Chrome / Windows',
          timestamp: '2026-02-25 09:30:15',
          details: 'Connexion réussie depuis Pointe-Noire'
        },
        {
          id: 2,
          user: 'technicien1@ofis.com',
          action: 'TENTATIVE_ECHEC',
          status: 'échec',
          ip: '41.123.45.67',
          device: 'Firefox / Android',
          timestamp: '2026-02-25 08:45:22',
          details: 'Mot de passe incorrect (3ème tentative)'
        },
        {
          id: 3,
          user: 'manager@ofis.com',
          action: 'MODIFICATION',
          status: 'succès',
          ip: '192.168.1.105',
          device: 'Safari / MacOS',
          timestamp: '2026-02-25 08:12:07',
          details: 'Modification des droits utilisateur #45'
        },
      ];
      setLogs(mockLogs);
      setLoading(false);
    }, 1000);
  };

  const handleSaveSecurity = () => {
    setLoading(true);
    setTimeout(() => {
      alert('✅ Paramètres de sécurité enregistrés');
      setLoading(false);
    }, 1000);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'succès': return '#10b981';
      case 'échec': return '#ef4444';
      case 'bloqué': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'succès': return <FaCheck style={{color: '#10b981'}} />;
      case 'échec': return <FaTimes style={{color: '#ef4444'}} />;
      case 'bloqué': return <FaExclamationTriangle style={{color: '#f59e0b'}} />;
      default: return null;
    }
  };

  const getActionIcon = (action) => {
    switch(action) {
      case 'CONNEXION': return <FaGlobe />;
      case 'TENTATIVE_ECHEC': return <FaExclamationTriangle />;
      case 'MODIFICATION': return <FaUserShield />;
      case 'SAUVEGARDE': return <FaHistory />;
      case 'TENTATIVE_BLOCAGE': return <FaLock />;
      case 'CONFIGURATION': return <FaShieldAlt />;
      case 'DÉCONNEXION': return <FaTimes />;
      default: return <FaEye />;
    }
  };

  const filteredLogs = logs.filter(log => 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.ip.includes(searchTerm) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'logs', label: '📋 Journal d\'activité', icon: <FaHistory /> },
    { id: 'security', label: '🔒 Paramètres sécurité', icon: <FaShieldAlt /> },
    { id: 'audit', label: '👮 Audit', icon: <FaUserShield /> },
    { id: 'blocked', label: '⛔ IP bloquées', icon: <FaLock /> },
  ];

  return (
    <div style={styles.container}>
      {/* En-tête */}
      <div style={styles.header}>
        <Button variant="outline" onClick={onBack} style={styles.backButton}>
          <FaArrowLeft /> Retour
        </Button>
        <div>
          <h1 style={styles.title}>Sécurité & Logs</h1>
          <p style={styles.subtitle}>Journal d'activité et paramètres de sécurité</p>
        </div>
      </div>

      {/* Onglets */}
      <div style={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {})
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <Card style={styles.content}>
        {/* Journal d'activité */}
        {activeTab === 'logs' && (
          <div>
            <div style={styles.logsHeader}>
              <h2 style={styles.sectionTitle}>📋 Journal d'activité</h2>
              
              {/* Filtres */}
              <div style={styles.filters}>
                <div style={styles.searchBox}>
                  <FaSearch style={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>

                <select 
                  style={styles.filterSelect}
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="today">Aujourd'hui</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                </select>

                <Button variant="outline" size="small">
                  <FaDownload /> Exporter
                </Button>
              </div>
            </div>

            {loading ? (
              <div style={styles.loading}>Chargement des logs...</div>
            ) : (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Horodatage</th>
                      <th>Utilisateur</th>
                      <th>Action</th>
                      <th>Statut</th>
                      <th>IP</th>
                      <th>Appareil</th>
                      <th>Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map(log => (
                      <tr key={log.id}>
                        <td style={styles.timestamp}>{log.timestamp}</td>
                        <td style={styles.userCell}>
                          <strong>{log.user}</strong>
                        </td>
                        <td>
                          <span style={styles.actionBadge}>
                            {getActionIcon(log.action)} {log.action}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            ...styles.statusBadge,
                            backgroundColor: getStatusColor(log.status) + '20',
                            color: getStatusColor(log.status)
                          }}>
                            {getStatusIcon(log.status)} {log.status}
                          </span>
                        </td>
                        <td style={styles.ipCell}>{log.ip}</td>
                        <td style={styles.deviceCell}>
                          {log.device.includes('Mobile') ? <FaMobile /> : <FaDesktop />}
                          {' '}{log.device}
                        </td>
                        <td style={styles.detailsCell}>{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Paramètres de sécurité */}
        {activeTab === 'security' && (
          <div>
            <h2 style={styles.sectionTitle}>🔒 Paramètres de sécurité</h2>
            <div style={styles.securityContent}>
              <p style={styles.placeholderText}>
                Interface de configuration des paramètres de sécurité à implémenter
              </p>
            </div>
          </div>
        )}

        {/* Audit */}
        {activeTab === 'audit' && (
          <div>
            <h2 style={styles.sectionTitle}>👮 Journal d'audit</h2>
            <div style={styles.placeholderContent}>
              <p style={styles.placeholderText}>
                Journal des actions administratives à implémenter
              </p>
            </div>
          </div>
        )}

        {/* IP bloquées */}
        {activeTab === 'blocked' && (
          <div>
            <h2 style={styles.sectionTitle}>⛔ IP bloquées</h2>
            <div style={styles.placeholderContent}>
              <p style={styles.placeholderText}>
                Liste des IP bloquées à implémenter
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #e5e7eb',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginRight: '1rem',
  },
  title: {
    margin: '0 0 0.25rem 0',
    color: '#111827',
    fontSize: '1.8rem',
  },
  subtitle: {
    margin: 0,
    color: '#6b7280',
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: '0.5rem',
    flexWrap: 'wrap',
  },
  tab: {
    padding: '0.75rem 1.5rem',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '0.95rem',
    color: '#6b7280',
    borderRadius: '8px 8px 0 0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  tabActive: {
    color: '#1E6FD9',
    borderBottom: '3px solid #1E6FD9',
    fontWeight: '500',
  },
  content: {
    padding: '2rem',
    minHeight: '400px',
  },
  sectionTitle: {
    margin: '0 0 1.5rem 0',
    color: '#111827',
    fontSize: '1.3rem',
  },
  logsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  filters: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '0.25rem 0.5rem',
    backgroundColor: 'white',
  },
  searchIcon: {
    color: '#9ca3af',
    marginRight: '0.5rem',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    padding: '0.5rem',
    width: '200px',
  },
  filterSelect: {
    padding: '0.5rem',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    backgroundColor: 'white',
  },
  tableContainer: {
    overflowX: 'auto',
    marginBottom: '2rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  timestamp: {
    whiteSpace: 'nowrap',
    color: '#6b7280',
  },
  userCell: {
    fontWeight: '500',
  },
  actionBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.5rem',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.85rem',
  },
  ipCell: {
    fontFamily: 'monospace',
  },
  deviceCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  detailsCell: {
    maxWidth: '250px',
    color: '#6b7280',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#6b7280',
  },
  securityContent: {
    padding: '2rem',
    textAlign: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  placeholderContent: {
    padding: '2rem',
    textAlign: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  placeholderText: {
    color: '#6b7280',
    fontSize: '1rem',
  },
};

// ← TRÈS IMPORTANT: CET EXPORT DOIT ÊTRE PRÉSENT
export default SecurityPage;