import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { 
  FaBuilding, FaPlus, FaEdit, FaTrash,
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaUser,
  FaUserTie, FaCalendarAlt
} from 'react-icons/fa';
import api from '../services/api';
import './Pages.css';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientForm, setClientForm] = useState({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await api.getClients();
      if (Array.isArray(response)) {
        setClients(response);
      } else if (response.data && Array.isArray(response.data)) {
        setClients(response.data);
      } else if (response.results && Array.isArray(response.results)) {
        setClients(response.results);
      } else {
        setClients([]);
      }
      setError(null);
    } catch (err) {
      console.error("Erreur chargement clients:", err);
      setError("Impossible de charger les clients");
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    if (!clientForm.firstName && !clientForm.lastName && !clientForm.company) {
      alert("Veuillez renseigner au moins le nom du contact ou le nom de l'entreprise");
      return;
    }

    try {
      await api.createClient({
        firstName: clientForm.firstName,
        lastName: clientForm.lastName,
        company: clientForm.company,
        email: clientForm.email,
        phone: clientForm.phone,
        address: clientForm.address
      });
      await loadClients();
      setShowAddModal(false);
      resetForm();
      alert("Client ajouté avec succès !");
    } catch (err) {
      console.error("Erreur ajout client:", err);
      alert("Erreur: " + (err.message || "Erreur lors de l'ajout du client"));
    }
  };

  const handleEditClient = async () => {
    if (!selectedClient) return;
    try {
      await api.updateClient(selectedClient.id, {
        firstName: clientForm.firstName,
        lastName: clientForm.lastName,
        company: clientForm.company,
        email: clientForm.email,
        phone: clientForm.phone,
        address: clientForm.address
      });
      await loadClients();
      setShowEditModal(false);
      resetForm();
      alert("Client modifié avec succès !");
    } catch (err) {
      console.error("Erreur modification client:", err);
      alert("Erreur: " + (err.message || "Erreur lors de la modification du client"));
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    try {
      await api.deleteClient(selectedClient.id);
      await loadClients();
      setShowDeleteModal(false);
      setSelectedClient(null);
      alert("Client supprimé avec succès !");
    } catch (err) {
      console.error("Erreur suppression client:", err);
      let errorMsg = "Erreur lors de la suppression du client";
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.detail) errorMsg = parsed.detail;
      } catch {
        if (err.message && !err.message.includes("<!DOCTYPE")) errorMsg = err.message;
      }
      alert(errorMsg);
    }
  };

  const resetForm = () => {
    setClientForm({
      firstName: '',
      lastName: '',
      company: '',
      email: '',
      phone: '',
      address: ''
    });
    setSelectedClient(null);
  };

  const openEditModal = (client) => {
    setSelectedClient(client);
    setClientForm({
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      company: client.company || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (client) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-page loading">
        <div className="loading-spinner"></div>
        <p>Chargement des clients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
          <p>{error}</p>
          <Button onClick={loadClients}>Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Clients</h1>
          <p style={{ color: '#666', marginTop: '0.5rem' }}>
            {clients.length} client(s) enregistré(s)
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          <FaPlus /> Nouveau client
        </Button>
      </div>

      {clients.length === 0 ? (
        <Card style={{ padding: '3rem', textAlign: 'center' }}>
          <FaBuilding size={48} color="#9ca3af" />
          <h3 style={{ margin: '1rem 0', color: '#6b7280' }}>Aucun client</h3>
          <p>Commencez par ajouter votre premier client.</p>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <FaPlus /> Ajouter un client
          </Button>
        </Card>
      ) : (
        <div style={styles.grid}>
          {clients.map(client => {
            const displayName = client.company || 
              `${client.firstName || ''} ${client.lastName || ''}`.trim() || 
              'Client sans nom';
            const hasCompany = !!client.company;
            
            return (
              <Card key={client.id} className="client-card" style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={{
                    ...styles.avatar,
                    backgroundColor: hasCompany ? '#dbeafe' : '#f3e8ff'
                  }}>
                    {hasCompany ? <FaBuilding /> : <FaUser />}
                  </div>
                  <div style={styles.clientInfo}>
                    <h3 style={styles.clientName}>{displayName}</h3>
                    {hasCompany ? (
                      <p style={styles.clientSubtitle}>
                        <FaUserTie /> {client.firstName} {client.lastName}
                      </p>
                    ) : (
                      <p style={styles.clientSubtitle}>Contact principal</p>
                    )}
                  </div>
                </div>

                <div style={styles.details}>
                  {client.email && (
                    <p style={styles.detailItem}>
                      <FaEnvelope style={styles.detailIcon} color="#3b82f6" />
                      <span>{client.email}</span>
                    </p>
                  )}
                  {client.phone && (
                    <p style={styles.detailItem}>
                      <FaPhone style={styles.detailIcon} color="#10b981" />
                      <span>{client.phone}</span>
                    </p>
                  )}
                  {client.address && (
                    <p style={styles.detailItem}>
                      <FaMapMarkerAlt style={styles.detailIcon} color="#ef4444" />
                      <span>{client.address}</span>
                    </p>
                  )}
                  {client.createdAt && (
                    <p style={styles.detailItem}>
                      <FaCalendarAlt style={styles.detailIcon} color="#8b5cf6" />
                      <span>Client depuis le {formatDate(client.createdAt)}</span>
                    </p>
                  )}
                </div>

                <div style={styles.actions}>
                  <Button 
                    size="small" 
                    variant="outline"
                    onClick={() => openEditModal(client)}
                    title="Modifier"
                  >
                    <FaEdit />
                  </Button>
                  <Button 
                    size="small" 
                    variant="outline"
                    onClick={() => openDeleteModal(client)}
                    title="Supprimer"
                  >
                    <FaTrash />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal d'ajout */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => { setShowAddModal(false); resetForm(); }}
          title="Ajouter un nouveau client"
        >
          <form onSubmit={(e) => { e.preventDefault(); handleAddClient(); }}>
            <div style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
              Remplissez au moins le nom du contact ou le nom de l'entreprise
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Prénom"
                value={clientForm.firstName}
                onChange={(e) => setClientForm({...clientForm, firstName: e.target.value})}
                icon={<FaUser />}
              />
              <Input
                label="Nom"
                value={clientForm.lastName}
                onChange={(e) => setClientForm({...clientForm, lastName: e.target.value})}
                icon={<FaUser />}
              />
            </div>
            <Input
              label="Entreprise (optionnel)"
              value={clientForm.company}
              onChange={(e) => setClientForm({...clientForm, company: e.target.value})}
              icon={<FaBuilding />}
            />
            <Input
              label="Email"
              type="email"
              value={clientForm.email}
              onChange={(e) => setClientForm({...clientForm, email: e.target.value})}
              icon={<FaEnvelope />}
            />
            <Input
              label="Téléphone"
              value={clientForm.phone}
              onChange={(e) => setClientForm({...clientForm, phone: e.target.value})}
              icon={<FaPhone />}
            />
            <Input
              label="Adresse"
              value={clientForm.address}
              onChange={(e) => setClientForm({...clientForm, address: e.target.value})}
              icon={<FaMapMarkerAlt />}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }}>
                Annuler
              </Button>
              <Button type="submit" variant="primary">
                Ajouter le client
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal d'édition */}
      {showEditModal && selectedClient && (
        <Modal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); resetForm(); }}
          title={`Modifier ${selectedClient.company || selectedClient.firstName || 'le client'}`}
        >
          <form onSubmit={(e) => { e.preventDefault(); handleEditClient(); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Prénom"
                value={clientForm.firstName}
                onChange={(e) => setClientForm({...clientForm, firstName: e.target.value})}
                icon={<FaUser />}
              />
              <Input
                label="Nom"
                value={clientForm.lastName}
                onChange={(e) => setClientForm({...clientForm, lastName: e.target.value})}
                icon={<FaUser />}
              />
            </div>
            <Input
              label="Entreprise"
              value={clientForm.company}
              onChange={(e) => setClientForm({...clientForm, company: e.target.value})}
              icon={<FaBuilding />}
            />
            <Input
              label="Email"
              type="email"
              value={clientForm.email}
              onChange={(e) => setClientForm({...clientForm, email: e.target.value})}
              icon={<FaEnvelope />}
            />
            <Input
              label="Téléphone"
              value={clientForm.phone}
              onChange={(e) => setClientForm({...clientForm, phone: e.target.value})}
              icon={<FaPhone />}
            />
            <Input
              label="Adresse"
              value={clientForm.address}
              onChange={(e) => setClientForm({...clientForm, address: e.target.value})}
              icon={<FaMapMarkerAlt />}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button variant="outline" onClick={() => { setShowEditModal(false); resetForm(); }}>
                Annuler
              </Button>
              <Button type="submit" variant="primary">
                Modifier le client
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de suppression */}
      {showDeleteModal && selectedClient && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => { setShowDeleteModal(false); setSelectedClient(null); }}
          title="Confirmer la suppression"
        >
          <p>
            Êtes-vous sûr de vouloir supprimer 
            <strong> {selectedClient.company || `${selectedClient.firstName} ${selectedClient.lastName}`.trim() || 'ce client'}</strong> ?
          </p>
          <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>
            Cette action est irréversible.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button variant="outline" onClick={() => { setShowDeleteModal(false); setSelectedClient(null); }}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDeleteClient}>
              Supprimer
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    transition: 'transform 0.3s, box-shadow 0.3s',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
    }
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  },
  avatar: {
    width: '70px',
    height: '70px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    color: '#1E6FD9',
    boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    margin: '0 0 0.25rem 0',
    color: '#111827',
    fontSize: '1.2rem',
    fontWeight: '600',
  },
  clientSubtitle: {
    margin: 0,
    color: '#6b7280',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  details: {
    margin: '1rem 0',
    padding: '1rem',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    flex: 1,
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    margin: '0.5rem 0',
    fontSize: '0.9rem',
    color: '#374151',
  },
  detailIcon: {
    fontSize: '1rem',
    minWidth: '20px',
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
    marginTop: '0.5rem',
  },
};

export default ClientsPage;