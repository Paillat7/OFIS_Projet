import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { 
  FaDownload, FaUpload, FaDatabase, FaTable, FaFileExport, 
  FaHistory, FaArrowLeft, FaUsers, FaWrench, FaUserTie, 
  FaClipboardList, FaFileAlt, FaMapMarkerAlt, FaFlag,
  FaUser, FaEnvelope, FaPhone, FaBuilding, FaCalendar,
  FaCheck, FaTimes, FaExclamationTriangle, FaEye,
  FaChartBar, FaClock, FaMoneyBill, FaTools, FaStar
} from 'react-icons/fa';
import api from '../services/api';
import './Pages.css';

const DataBaseManagement = ({ onBack }) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backupHistory, setBackupHistory] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);
  const [tableInfo, setTableInfo] = useState({});
  const [expandedTable, setExpandedTable] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const itemsPerPage = 10;

  useEffect(() => {
    loadTables();
    loadBackupHistory();
  }, []);

  const loadTables = async () => {
    setLoading(true);
    try {
      const result = await api.getAdminTables();
      if (result.success) {
        const allTables = result.data.filter(table => 
          table.name !== 'sqlite_sequence' && 
          !table.name.startsWith('sqlite_')
        );
        setTables(allTables);
        for (const table of allTables) {
          await loadTableData(table.name);
        }
      } else {
        setErrorMessage(result.error || 'Erreur chargement tables');
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (tableName) => {
    try {
      const result = await api.getAdminTable(tableName);
      if (result.success) {
        setTableInfo(prev => ({
          ...prev,
          [tableName]: {
            data: result.data,
            count: result.data.length,
            columns: result.data.length > 0 ? Object.keys(result.data[0]) : []
          }
        }));
      }
    } catch (error) {
      console.error(`❌ Erreur chargement ${tableName}:`, error);
    }
  };

  const loadBackupHistory = async () => {
    try {
      const result = await api.getAdminBackups();
      if (result.success) {
        setBackupHistory(result.data);
      } else {
        console.error('Erreur historique:', result.error);
      }
    } catch (error) {
      console.error('❌ Erreur chargement historique:', error);
    }
  };

  const handleViewTable = (tableName) => {
    if (expandedTable === tableName) {
      setExpandedTable(null);
      setSelectedTable(null);
    } else {
      setExpandedTable(tableName);
      setSelectedTable(tableName);
      setCurrentPage(1);
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await api.postAdminBackup();
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.sql`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccessMessage('✅ Backup créé avec succès');
      loadBackupHistory();
    } catch (error) {
      setErrorMessage('❌ Erreur lors du backup: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('backup', file);

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const result = await api.postAdminRestore(formData);
      if (result.success) {
        setSuccessMessage('✅ Base de données restaurée avec succès');
        loadTables();
        loadBackupHistory();
      } else {
        setErrorMessage('❌ Erreur: ' + result.error);
      }
    } catch (error) {
      setErrorMessage('❌ Erreur lors de la restauration: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportTable = async (tableName) => {
    try {
      const response = await api.getAdminTableExport(tableName);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tableName}-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccessMessage(`✅ Table ${tableName} exportée`);
    } catch (error) {
      setErrorMessage('❌ Erreur lors de l\'export: ' + error.message);
    }
  };

  const handleOptimize = async () => {
    if (!window.confirm('Voulez-vous optimiser la base de données ?')) return;
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const result = await api.postAdminOptimize();
      if (result.success) {
        setSuccessMessage('✅ Base de données optimisée');
      } else {
        setErrorMessage('❌ Erreur: ' + result.error);
      }
    } catch (error) {
      setErrorMessage('❌ Erreur optimisation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTableDisplayName = (tableName) => {
    const names = {
      'auth_user': '👤 Utilisateurs',
      'auth_group': '👥 Groupes',
      'auth_permission': '🔒 Permissions',
      'django_admin_log': '📋 Journal Admin',
      'django_content_type': '📁 Types de contenu',
      'django_migrations': '🔄 Migrations',
      'django_session': '🍪 Sessions',
      'api_client': '👥 Clients',
      'api_technician': '🔧 Techniciens',
      'api_manager': '👔 Managers',
      'api_mission': '📋 Missions',
      'api_report': '📄 Rapports',
      'api_generatedreport': '📊 Rapports générés',
      'api_generatedreportdownload': '⬇️ Téléchargements',
      'api_team': '🚀 Équipes',
      'api_position': '📍 Positions GPS'
    };
    return names[tableName] || tableName.replace('api_', '📌 ').replace(/_/g, ' ');
  };

  const formatValue = (value, column) => {
    if (value === null || value === undefined) return <span style={{color: '#999'}}>—</span>;
    
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(value).toLocaleDateString('fr-FR');
    }
    
    if (typeof value === 'string' && value.includes('T') && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
      return new Date(value).toLocaleString('fr-FR');
    }
    
    if (typeof value === 'boolean' || value === 'true' || value === 'false') {
      const bool = value === true || value === 'true';
      return bool 
        ? <span style={{color: '#10b981'}}><FaCheck /> Oui</span>
        : <span style={{color: '#ef4444'}}><FaTimes /> Non</span>;
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString('fr-FR');
    }
    
    if (column.toLowerCase().includes('email') && typeof value === 'string') {
      return <a href={`mailto:${value}`} style={{color: '#1E6FD9'}}>{value}</a>;
    }
    
    if (column.toLowerCase().includes('phone') && typeof value === 'string') {
      return <a href={`tel:${value}`} style={{color: '#1E6FD9'}}>{value}</a>;
    }
    
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    
    return String(value);
  };

  const filteredTables = tables.filter(table =>
    getTableDisplayName(table.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="database-page" style={styles.container}>
      {/* En-tête */}
      <div style={styles.header}>
        <Button variant="outline" onClick={onBack} style={styles.backButton}>
          <FaArrowLeft /> Retour
        </Button>
        <div>
          <h1 style={styles.title}>Gestion Base de Données</h1>
          <p style={styles.subtitle}>Visualisation complète de toutes les tables</p>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div style={styles.errorMessage}>
          <FaExclamationTriangle /> {errorMessage}
          <button onClick={() => setErrorMessage('')} style={styles.closeBtn}>×</button>
        </div>
      )}
      {successMessage && (
        <div style={styles.successMessage}>
          <FaCheck /> {successMessage}
          <button onClick={() => setSuccessMessage('')} style={styles.closeBtn}>×</button>
        </div>
      )}

      {/* Actions */}
      <div style={styles.actions}>
        <Card style={styles.actionCard}>
          <FaDownload size={24} color="#1E6FD9" />
          <h3>Backup</h3>
          <p>Sauvegarder toute la base</p>
          <Button onClick={handleBackup} disabled={loading}>
            {loading ? 'En cours...' : 'Créer backup'}
          </Button>
        </Card>

        <Card style={styles.actionCard}>
          <FaUpload size={24} color="#10b981" />
          <h3>Restaurer</h3>
          <p>Restaurer depuis backup</p>
          <input 
            type="file" 
            accept=".sql" 
            onChange={handleRestore} 
            style={{display: 'none'}} 
            id="restore-input" 
          />
          <Button 
            variant="outline" 
            onClick={() => document.getElementById('restore-input').click()}
          >
            Choisir fichier
          </Button>
        </Card>

        <Card style={styles.actionCard}>
          <FaDatabase size={24} color="#f59e0b" />
          <h3>Optimiser</h3>
          <p>Nettoyer et optimiser</p>
          <Button variant="outline" onClick={handleOptimize} disabled={loading}>
            Optimiser
          </Button>
        </Card>
      </div>

      {/* Barre de recherche */}
      <div style={styles.searchBar}>
        <input
          type="text"
          placeholder="🔍 Rechercher une table..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Liste des tables */}
      <div style={styles.tablesContainer}>
        {loading && <div style={styles.loading}>Chargement des données...</div>}
        
        {filteredTables.map((table) => {
          const info = tableInfo[table.name] || { count: 0, data: [], columns: [] };
          const isExpanded = expandedTable === table.name;
          
          return (
            <Card key={table.name} style={styles.tableCard}>
              <div 
                style={styles.tableHeader}
                onClick={() => handleViewTable(table.name)}
              >
                <div style={styles.tableTitle}>
                  {getTableDisplayName(table.name)}
                  <span style={styles.tableCount}>
                    {info.count} enregistrement{info.count > 1 ? 's' : ''}
                  </span>
                </div>
                <div style={styles.tableActions}>
                  <Button 
                    size="small" 
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); handleExportTable(table.name); }}
                  >
                    <FaFileExport /> Exporter CSV
                  </Button>
                  <Button 
                    size="small" 
                    variant={isExpanded ? 'primary' : 'outline'}
                    onClick={(e) => { e.stopPropagation(); handleViewTable(table.name); }}
                  >
                    <FaEye /> {isExpanded ? 'Masquer' : 'Voir données'}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div style={styles.tableData}>
                  {info.data.length === 0 ? (
                    <p style={styles.emptyData}>Aucune donnée dans cette table</p>
                  ) : (
                    <>
                      <div style={styles.tableWrapper}>
                        <table style={styles.dataTable}>
                          <thead>
                            <tr>
                              {info.columns.map(col => (
                                <th key={col}>{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {info.data.slice(0, 20).map((row, idx) => (
                              <tr key={idx}>
                                {info.columns.map(col => (
                                  <td key={col}>{formatValue(row[col], col)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {info.data.length > 20 && (
                        <p style={styles.moreData}>
                          Affichage des 20 premiers enregistrements sur {info.data.length}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Historique des backups */}
      <Card title="📜 Historique des backups" style={styles.historyCard}>
        <div style={styles.historyList}>
          {backupHistory.length === 0 ? (
            <p style={styles.emptyMessage}>Aucun backup disponible</p>
          ) : (
            backupHistory.map((backup, idx) => (
              <div key={idx} style={styles.historyItem}>
                <FaHistory style={{color: '#f59e0b'}} />
                <div style={styles.historyInfo}>
                  <strong>{backup.filename}</strong>
                  <div style={styles.historyMeta}>
                    <span>{backup.date}</span>
                    <span>{backup.size}</span>
                  </div>
                </div>
                {/* Vous pouvez ajouter un bouton pour restaurer ce backup spécifique si l'API le permet */}
              </div>
            ))
          )}
        </div>
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
  errorMessage: {
    padding: '1rem',
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    border: '1px solid #fecaca',
    borderRadius: '4px',
    marginBottom: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successMessage: {
    padding: '1rem',
    backgroundColor: '#dcfce7',
    color: '#166534',
    border: '1px solid #bbf7d0',
    borderRadius: '4px',
    marginBottom: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: 'inherit',
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  actionCard: {
    padding: '1.5rem',
    textAlign: 'center',
  },
  searchBar: {
    marginBottom: '2rem',
  },
  searchInput: {
    width: '100%',
    padding: '1rem',
    fontSize: '1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  tablesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '2rem',
  },
  tableCard: {
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    cursor: 'pointer',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    transition: 'background-color 0.2s',
  },
  tableTitle: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#111827',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  tableCount: {
    fontSize: '0.9rem',
    color: '#6b7280',
    fontWeight: 'normal',
  },
  tableActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  tableData: {
    padding: '1rem',
    backgroundColor: 'white',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  dataTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  emptyData: {
    textAlign: 'center',
    color: '#6b7280',
    padding: '2rem',
  },
  moreData: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: '1rem',
    fontSize: '0.9rem',
  },
  historyCard: {
    marginTop: '2rem',
  },
  historyList: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  historyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem',
    borderBottom: '1px solid #e5e7eb',
  },
  historyInfo: {
    flex: 1,
  },
  historyMeta: {
    display: 'flex',
    gap: '1rem',
    fontSize: '0.8rem',
    color: '#6b7280',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#6b7280',
    padding: '2rem',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#1E6FD9',
  },
};

export default DataBaseManagement;