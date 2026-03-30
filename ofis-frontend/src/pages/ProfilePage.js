import React from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { FaUser, FaEnvelope, FaPhone, FaKey } from 'react-icons/fa';

const ProfilePage = () => {
  const user = JSON.parse(localStorage.getItem('ofis_user')) || {
    name: 'Trésor NDINGA',
    email: 'tresor.ndinga@ofis.cg',
    role: 'Administrateur',
    phone: '+242 06 XXX XX XX'
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Mon profil</h1>
      </div>

      <div style={styles.layout}>
        <Card title="Informations personnelles" style={styles.profileCard}>
          <div style={styles.profileInfo}>
            <div style={styles.avatar}>
              <FaUser size={48} />
            </div>
            <div style={styles.details}>
              <div style={styles.detailItem}>
                <FaUser style={styles.detailIcon} />
                <span>Nom : {user.name}</span>
              </div>
              <div style={styles.detailItem}>
                <FaEnvelope style={styles.detailIcon} />
                <span>Email : {user.email}</span>
              </div>
              <div style={styles.detailItem}>
                <FaUser style={styles.detailIcon} />
                <span>Rôle : {user.role}</span>
              </div>
              <div style={styles.detailItem}>
                <FaPhone style={styles.detailIcon} />
                <span>Téléphone : {user.phone}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Sécurité" style={styles.securityCard}>
          <Button variant="outline">
            <FaKey /> Changer le mot de passe
          </Button>
        </Card>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #e5e7eb',
  },
  title: {
    margin: 0,
    color: '#111827',
    fontSize: '2rem',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '2rem',
  },
  '@media (max-width: 768px)': {
    layout: {
      gridTemplateColumns: '1fr',
    },
  },
  profileCard: {
    padding: '2rem',
  },
  profileInfo: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'flex-start',
  },
  avatar: {
    width: '100px',
    height: '100px',
    backgroundColor: '#dbeafe',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#1E6FD9',
  },
  details: {
    flex: 1,
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
    padding: '0.75rem',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  detailIcon: {
    color: '#6b7280',
    width: '20px',
  },
  securityCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '2rem',
  },
};

export default ProfilePage;