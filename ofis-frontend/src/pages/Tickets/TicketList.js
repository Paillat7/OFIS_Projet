import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ticketService } from '../../services/ticketService';
import { authService } from '../../services/authService';
import { FaPlus, FaEye, FaTrash } from 'react-icons/fa';

const TicketList = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtrePriorite, setFiltrePriorite] = useState('');
  const user = authService.getCurrentUser();
  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin';
  const isAssistant = user?.role === 'assistant';
  const canCreate = isAssistant || isManagerOrAdmin;

  // ===== FLAG =====
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const chargerTickets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtreStatut) params.statut = filtreStatut;
      if (filtrePriorite) params.priorite = filtrePriorite;
      const data = await ticketService.getAll(params);
      if (isMounted.current) {
        setTickets(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      if (isMounted.current) {
        console.error('Erreur chargement tickets:', error);
        setTickets([]);
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    chargerTickets();
  }, [filtreStatut, filtrePriorite]);

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce ticket ?')) {
      try {
        await ticketService.delete(id);
        chargerTickets();
      } catch (error) {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const getStatutBadge = (statut) => {
    const styles = {
      nouveau: { bg: '#e0f2fe', color: '#0369a1', label: 'Nouveau' },
      en_cours: { bg: '#fef3c7', color: '#d97706', label: 'En cours' },
      resolu: { bg: '#d1fae5', color: '#059669', label: 'Résolu' },
      ferme: { bg: '#f3f4f6', color: '#6b7280', label: 'Fermé' },
    };
    return styles[statut] || styles.nouveau;
  };

  const getPrioriteBadge = (priorite) => {
    const styles = {
      basse: { bg: '#e0f2fe', color: '#0369a1', label: 'Basse' },
      moyenne: { bg: '#fef3c7', color: '#d97706', label: 'Moyenne' },
      haute: { bg: '#fee2e2', color: '#dc2626', label: 'Haute' },
      critique: { bg: '#dc2626', color: 'white', label: 'Critique' },
    };
    return styles[priorite] || styles.moyenne;
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Tickets / Incidents</h1>
        {canCreate && (
          <Link to="/tickets/nouveau">
            <Button variant="primary"><FaPlus /> Nouveau ticket</Button>
          </Link>
        )}
      </div>

      {/* Filtres */}
      <Card style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="">Tous les statuts</option>
            <option value="nouveau">Nouveau</option>
            <option value="en_cours">En cours</option>
            <option value="resolu">Résolu</option>
            <option value="ferme">Fermé</option>
          </select>
          <select value={filtrePriorite} onChange={(e) => setFiltrePriorite(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="">Toutes les priorités</option>
            <option value="basse">Basse</option>
            <option value="moyenne">Moyenne</option>
            <option value="haute">Haute</option>
            <option value="critique">Critique</option>
          </select>
          <Button variant="outline" size="small" onClick={() => { setFiltreStatut(''); setFiltrePriorite(''); }}>Réinitialiser</Button>
        </div>
      </Card>

      {/* Liste des tickets */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {tickets.length === 0 ? (
          <Card><p>Aucun ticket trouvé.</p></Card>
        ) : (
          tickets.map(ticket => {
            const statut = getStatutBadge(ticket.statut);
            const priorite = getPrioriteBadge(ticket.priorite);
            const numero = ticket.numero || ticket.id;
            return (
              <Card key={ticket.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0 }}>N°{numero} - {ticket.titre}</h3>
                      <span style={{ backgroundColor: statut.bg, color: statut.color, padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>{statut.label}</span>
                      <span style={{ backgroundColor: priorite.bg, color: priorite.color, padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>{priorite.label}</span>
                    </div>
                    <p style={{ margin: '0.5rem 0 0.25rem', color: '#666' }}><strong>Client:</strong> {ticket.client_name || '-'}</p>
                    <p style={{ margin: '0.25rem 0' }}><strong>Assigné à:</strong> {ticket.technicien_nom || 'Non assigné'}</p>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#999' }}>Créé le {new Date(ticket.date_creation).toLocaleDateString()} par {ticket.cree_par_nom}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/tickets/${ticket.id}`}>
                      <Button variant="outline" size="small"><FaEye /> Voir</Button>
                    </Link>
                    {isManagerOrAdmin && (
                      <Button variant="danger" size="small" onClick={() => handleDelete(ticket.id)}><FaTrash /></Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TicketList;