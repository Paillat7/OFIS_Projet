import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { 
  FaArrowLeft, FaSave, FaGlobe, FaBell, 
  FaEnvelope, FaLock, FaDatabase, FaLanguage,
  FaServer, FaShieldAlt, FaChartBar, FaPalette
} from 'react-icons/fa';

const ConfigPage = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [config, setConfig] = useState({
    // Configuration générale
    appName: 'OFIS',
    companyName: 'OFIS Technologies',
    
    // Paramètres régionaux
    language: 'fr',
    timezone: 'Africa/Brazzaville',
    dateFormat: 'dd/mm/yyyy',
    
    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    
    // Sécurité
    sessionTimeout: '30',
    maxLoginAttempts: '5',
    
    // Sauvegarde
    autoBackup: true,
    backupFrequency: 'daily',
  });

  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      alert('Configuration enregistrée avec succès !');
    }, 1000);
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: <FaGlobe /> },
    { id: 'regional', label: 'Régional', icon: <FaLanguage /> },
    { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
    { id: 'security', label: 'Sécurité', icon: <FaLock /> },
    { id: 'backup', label: 'Sauvegarde', icon: <FaDatabase /> },
  ];

  return (
    <div style={styles.container}>
      {/* En-tête */}
      <div style={styles.header}>
        <Button variant="outline" onClick={onBack} style={styles.backButton}>
          <FaArrowLeft /> Retour
        </Button>
        <div>
          <h1 style={styles.title}>Configuration</h1>
          <p style={styles.subtitle}>Paramètres de l'application</p>
        </div>
        <Button onClick={handleSave} disabled={loading} variant="primary">
          <FaSave /> {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
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
        {/* Onglet Général */}
        {activeTab === 'general' && (
          <div>
            <h2 style={styles.sectionTitle}>Informations générales</h2>
            <div style={styles.formGrid}>
              <Input
                label="Nom de l'application"
                value={config.appName}
                onChange={(e) => setConfig({...config, appName: e.target.value})}
              />
              <Input
                label="Nom de l'entreprise"
                value={config.companyName}
                onChange={(e) => setConfig({...config, companyName: e.target.value})}
              />
            </div>
          </div>
        )}

        {/* Onglet Régional */}
        {activeTab === 'regional' && (
          <div>
            <h2 style={styles.sectionTitle}>Paramètres régionaux</h2>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Langue</label>
                <select 
                  style={styles.select}
                  value={config.language}
                  onChange={(e) => setConfig({...config, language: e.target.value})}
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>Fuseau horaire</label>
                <select 
                  style={styles.select}
                  value={config.timezone}
                  onChange={(e) => setConfig({...config, timezone: e.target.value})}
                >
                  <option value="Africa/Brazzaville">Brazzaville (UTC+1)</option>
                  <option value="Europe/Paris">Paris (UTC+1)</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>Format de date</label>
                <select 
                  style={styles.select}
                  value={config.dateFormat}
                  onChange={(e) => setConfig({...config, dateFormat: e.target.value})}
                >
                  <option value="dd/mm/yyyy">31/12/2026</option>
                  <option value="yyyy-mm-dd">2026-12-31</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Notifications */}
        {activeTab === 'notifications' && (
          <div>
            <h2 style={styles.sectionTitle}>Notifications</h2>
            <div style={styles.checkboxGroup}>
              <label style={styles.checkbox}>
                <input 
                  type="checkbox" 
                  checked={config.emailNotifications}
                  onChange={(e) => setConfig({...config, emailNotifications: e.target.checked})}
                />
                Notifications par email
              </label>
              <label style={styles.checkbox}>
                <input 
                  type="checkbox" 
                  checked={config.smsNotifications}
                  onChange={(e) => setConfig({...config, smsNotifications: e.target.checked})}
                />
                Notifications par SMS
              </label>
              <label style={styles.checkbox}>
                <input 
                  type="checkbox" 
                  checked={config.pushNotifications}
                  onChange={(e) => setConfig({...config, pushNotifications: e.target.checked})}
                />
                Notifications push
              </label>
            </div>
          </div>
        )}

        {/* Onglet Sécurité */}
        {activeTab === 'security' && (
          <div>
            <h2 style={styles.sectionTitle}>Sécurité</h2>
            <div style={styles.formGrid}>
              <Input
                label="Expiration session (minutes)"
                type="number"
                value={config.sessionTimeout}
                onChange={(e) => setConfig({...config, sessionTimeout: e.target.value})}
              />
              <Input
                label="Tentatives max"
                type="number"
                value={config.maxLoginAttempts}
                onChange={(e) => setConfig({...config, maxLoginAttempts: e.target.value})}
              />
            </div>
          </div>
        )}

        {/* Onglet Sauvegarde */}
        {activeTab === 'backup' && (
          <div>
            <h2 style={styles.sectionTitle}>Sauvegarde automatique</h2>
            <div style={styles.formGrid}>
              <label style={styles.checkbox}>
                <input 
                  type="checkbox" 
                  checked={config.autoBackup}
                  onChange={(e) => setConfig({...config, autoBackup: e.target.checked})}
                />
                Activer les sauvegardes automatiques
              </label>
              
              {config.autoBackup && (
                <div>
                  <label style={styles.label}>Fréquence</label>
                  <select 
                    style={styles.select}
                    value={config.backupFrequency}
                    onChange={(e) => setConfig({...config, backupFrequency: e.target.value})}
                  >
                    <option value="daily">Quotidienne</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuelle</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Pied de page */}
      <div style={styles.footer}>
        <p style={styles.version}>Version 1.0.0</p>
        <p style={styles.copyright}>© 2026 OFIS Technologies</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #e5e7eb',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  title: {
    margin: 0,
    color: '#111827',
    fontSize: '2rem',
  },
  subtitle: {
    margin: '0.5rem 0 0 0',
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
    minHeight: '300px',
  },
  sectionTitle: {
    margin: '0 0 1.5rem 0',
    color: '#111827',
    fontSize: '1.3rem',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '0.5rem',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1.5rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
    color: '#374151',
  },
  select: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '1rem',
    backgroundColor: 'white',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontSize: '1rem',
    color: '#374151',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  footer: {
    marginTop: '2rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e5e7eb',
    textAlign: 'center',
  },
  version: {
    color: '#6b7280',
    fontSize: '0.9rem',
    margin: 0,
  },
  copyright: {
    color: '#9ca3af',
    fontSize: '0.8rem',
    margin: '0.25rem 0 0 0',
  },
};

export default ConfigPage;