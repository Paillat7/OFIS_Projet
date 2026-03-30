import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { authService } from '../services/authService';

const UserManagement = ({ onBack }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    is_staff: false,
    is_active: true,
    is_superuser: false
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAll();
      setUsers(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      is_staff: user.is_staff,
      is_active: user.is_active,
      is_superuser: user.is_superuser
    });
    setShowModal(true);
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Supprimer l'utilisateur ${username} ?`)) return;
    try {
      await userService.delete(id);
      await loadUsers();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await userService.update(editingUser.id, formData);
      } else {
        await userService.create(formData);
      }
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      await loadUsers();
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      is_staff: false,
      is_active: true,
      is_superuser: false
    });
  };

  const toggleStatus = async (user) => {
    try {
      await userService.patch(user.id, { is_active: !user.is_active });
      await loadUsers();
    } catch (err) {
      alert('Erreur lors du changement de statut');
    }
  };

  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  if (loading) return <div style={styles.loading}>Chargement...</div>;

  return (
    <div style={styles.container}>
      {/* En-tête */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>← Retour</button>
        <h2 style={styles.title}>Gestion des utilisateurs</h2>
        {isAdmin && (
          <button 
            onClick={() => {
              setEditingUser(null);
              resetForm();
              setShowModal(true);
            }}
            style={styles.addButton}
          >
            + Ajouter
          </button>
        )}
      </div>

      {/* Message d'erreur */}
      {error && (
        <div style={styles.error}>
          {error}
          <button onClick={loadUsers} style={styles.retryButton}>Réessayer</button>
        </div>
      )}

      {/* Tableau des utilisateurs */}
      <table style={styles.table}>
        <thead>
          <tr style={styles.tableHeader}>
            <th>ID</th>
            <th>Nom d'utilisateur</th>
            <th>Email</th>
            <th>Prénom</th>
            <th>Nom</th>
            <th>Staff</th>
            <th>Superuser</th>
            <th>Actif</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} style={!user.is_active ? styles.inactiveRow : {}}>
              <td>{user.id}</td>
              <td><strong>{user.username}</strong></td>
              <td>{user.email || '-'}</td>
              <td>{user.first_name || '-'}</td>
              <td>{user.last_name || '-'}</td>
              <td style={{ textAlign: 'center' }}>{user.is_staff ? '✓' : '-'}</td>
              <td style={{ textAlign: 'center' }}>{user.is_superuser ? '✓' : '-'}</td>
              <td style={{ textAlign: 'center' }}>
                <button
                  onClick={() => toggleStatus(user)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: user.is_active ? '#10b981' : '#ef4444',
                    fontSize: '20px',
                    cursor: 'pointer'
                  }}
                >
                  {user.is_active ? '✅' : '❌'}
                </button>
              </td>
              <td>
                <button 
                  onClick={() => handleEdit(user)}
                  style={styles.actionButton}
                  disabled={!isAdmin}
                >
                  ✏️
                </button>
                <button 
                  onClick={() => handleDelete(user.id, user.username)}
                  style={styles.actionButton}
                  disabled={!isAdmin || user.username === 'admin'}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal d'ajout/modification */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>
              {editingUser ? 'Modifier' : 'Ajouter'} un utilisateur
            </h3>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label>Nom d'utilisateur *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label>Prénom</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label>Nom</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.checkboxGroup}>
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={formData.is_staff}
                    onChange={(e) => setFormData({...formData, is_staff: e.target.checked})}
                  />
                  Staff
                </label>
                
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={formData.is_superuser}
                    onChange={(e) => setFormData({...formData, is_superuser: e.target.checked})}
                  />
                  Superuser
                </label>
                
                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  Actif
                </label>
              </div>

              <div style={styles.modalActions}>
                <button type="submit" style={styles.submitButton}>
                  {editingUser ? 'Modifier' : 'Créer'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  style={styles.cancelButton}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#f0f0f0',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  title: {
    margin: 0,
    fontSize: '24px'
  },
  addButton: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  error: {
    padding: '12px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
    borderRadius: '4px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  retryButton: {
    padding: '4px 12px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #dee2e6'
  },
  inactiveRow: {
    backgroundColor: '#f8d7da',
    opacity: 0.7
  },
  actionButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    margin: '0 5px',
    cursor: 'pointer',
    padding: '5px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    width: '500px',
    maxWidth: '90%'
  },
  modalTitle: {
    marginTop: 0,
    marginBottom: '20px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    flex: 1
  },
  formRow: {
    display: 'flex',
    gap: '15px'
  },
  input: {
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px'
  },
  checkboxGroup: {
    display: 'flex',
    gap: '20px',
    padding: '10px 0'
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    cursor: 'pointer'
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '20px'
  },
  submitButton: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};

export default UserManagement;