import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import UserManagement from './UserManagement';
import ReportsPage from './ReportsPage';
import DataBaseManagement from './DataBaseManagement';
import ConfigPage from './ConfigPage';
import SecurityPage from './SecurityPage';  // ← IMPORT AJOUTÉ POUR SÉCURITÉ
import { FaUsers, FaCog, FaDatabase, FaShieldAlt, FaFileAlt } from 'react-icons/fa';

const AdminPage = () => {
  const [activeSection, setActiveSection] = useState(null);

  const adminSections = [
    { id: 'users', title: 'Gestion utilisateurs', icon: <FaUsers />, description: 'Ajouter, modifier ou supprimer des utilisateurs' },
    { id: 'reports', title: 'Rapports', icon: <FaFileAlt />, description: 'Générer des rapports et exporter' },
    { id: 'database', title: 'Base de données', icon: <FaDatabase />, description: 'Backup et maintenance' },
    { id: 'config', title: 'Configuration', icon: <FaCog />, description: 'Paramètres de l\'application' },
    { id: 'security', title: 'Sécurité', icon: <FaShieldAlt />, description: 'Logs et audit' },
  ];

  if (activeSection === 'users') {
    return <UserManagement onBack={() => setActiveSection(null)} />;
  }
  
  if (activeSection === 'reports') {
    return <ReportsPage onBack={() => setActiveSection(null)} />;
  }
  
  if (activeSection === 'database') {
    return <DataBaseManagement onBack={() => setActiveSection(null)} />;
  }
  
  if (activeSection === 'config') {
    return <ConfigPage onBack={() => setActiveSection(null)} />;
  }
  
  // ← NOUVELLE CONDITION POUR SÉCURITÉ
  if (activeSection === 'security') {
    return <SecurityPage onBack={() => setActiveSection(null)} />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Administration</h1>
        <p style={styles.subtitle}>Espace réservé aux administrateurs</p>
      </div>

      <div style={styles.grid}>
        {adminSections.map((section) => (
          <Card key={section.id} style={styles.card}>
            <div style={styles.section}>
              <div style={styles.icon}>
                {section.icon}
              </div>
              <h3 style={styles.sectionTitle}>{section.title}</h3>
              <p style={styles.description}>{section.description}</p>
              <Button 
                variant="outline" 
                size="small"
                onClick={() => setActiveSection(section.id)}
              >
                Accéder
              </Button>
            </div>
          </Card>
        ))}
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
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #e5e7eb',
  },
  title: {
    margin: '0 0 0.5rem 0',
    color: '#111827',
    fontSize: '2rem',
  },
  subtitle: {
    margin: 0,
    color: '#6b7280',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    textAlign: 'center',
    transition: 'transform 0.3s',
  },
  section: {
    padding: '1.5rem',
  },
  icon: {
    fontSize: '2.5rem',
    color: '#1E6FD9',
    marginBottom: '1rem',
  },
  sectionTitle: {
    margin: '0 0 0.5rem 0',
    color: '#111827',
  },
  description: {
    color: '#6b7280',
    marginBottom: '1rem',
  },
};

export default AdminPage;