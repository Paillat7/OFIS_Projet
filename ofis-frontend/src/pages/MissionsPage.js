import React from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { FaPlus, FaSearch, FaFilter } from 'react-icons/fa';

const MissionsPage = () => {
  const missions = [
    { id: 1, client: 'TotalEnergies', title: 'Audit sécurité réseau', status: 'En cours', date: '15/02/2026' },
    { id: 2, client: 'AGL', title: 'Migration cloud', status: 'Planifiée', date: '22/02/2026' },
    { id: 3, client: 'Perenco', title: 'Support télécom', status: 'Terminée', date: '13/02/2026' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Missions</h1>
        <Button variant="primary">
          <FaPlus /> Nouvelle mission
        </Button>
      </div>

      <Card title="Liste des missions">
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Client</th>
                <th style={styles.th}>Mission</th>
                <th style={styles.th}>Statut</th>
                <th style={styles.th}>Date début</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {missions.map(mission => (
                <tr key={mission.id} style={styles.tr}>
                  <td style={styles.td}>{mission.client}</td>
                  <td style={styles.td}>{mission.title}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      ...(mission.status === 'En cours' ? styles.statusInProgress : 
                           mission.status === 'Planifiée' ? styles.statusPlanned : 
                           styles.statusCompleted)
                    }}>
                      {mission.status}
                    </span>
                  </td>
                  <td style={styles.td}>{mission.date}</td>
                  <td style={styles.td}>
                    <Button size="small" variant="outline">
                      Détails
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #e5e7eb',
  },
  title: {
    margin: 0,
    color: '#111827',
    fontSize: '2rem',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    backgroundColor: '#f9fafb',
    padding: '1rem',
    textAlign: 'left',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '2px solid #e5e7eb',
  },
  tr: {
    borderBottom: '1px solid #e5e7eb',
  },
  trHover: {
    backgroundColor: '#f9fafb',
  },
  td: {
    padding: '1rem',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '600',
    display: 'inline-block',
  },
  statusInProgress: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  statusPlanned: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusCompleted: {
    backgroundColor: '#e0e7ff',
    color: '#3730a3',
  },
};

export default MissionsPage;