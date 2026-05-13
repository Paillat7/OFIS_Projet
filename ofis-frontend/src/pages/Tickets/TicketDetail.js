import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { ticketService } from '../../services/ticketService';
import api from '../../services/api';
import { authService } from '../../services/authService';
import { FaArrowLeft, FaUserCheck, FaClock, FaCheckCircle } from 'react-icons/fa';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [techniciens, setTechniciens] = useState([]);
  const [showTempsForm, setShowTempsForm] = useState(false);
  const [tempsValue, setTempsValue] = useState('');
  const [showSolutionForm, setShowSolutionForm] = useState(false);
  const [solutionValue, setSolutionValue] = useState('');
  const user = authService.getCurrentUser();
  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin';
  const isAssistant = user?.role === 'assistant';
  const isTechnicien = user?.role === 'technicien';
  const canAssign = isManagerOrAdmin;
  const canAddTime = isTechnicien || isManagerOrAdmin;
  const canAddSolution = isTechnicien || isManagerOrAdmin;

  useEffect(() => {
    chargerTicket();
    chargerTechniciens();
  }, [id]);

  const chargerTicket = async () => {
    setLoading(true);
    try {
      const data = await ticketService.getById(id);
      setTicket(data);
    } catch (error) {
      console.error('Erreur chargement ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const chargerTechniciens = async () => {
    try {
      const users = await api.getUsers();
      const techniciensData = users.filter(u => u.role === 'technicien');
      setTechniciens(techniciensData);
    } catch (error) {
      console.error('Erreur chargement techniciens:', error);
    }
  };

  const handleAssigner = async (technicienId) => {
    if (!technicienId) return;
    try {
      await ticketService.assigner(id, technicienId);
      chargerTicket();
      alert('Technicien assigné');
    } catch (error) {
      alert('Erreur lors de l\'assignation');
    }
  };

  const handleChangerStatut = async (statut) => {
    try {
      await ticketService.changerStatut(id, statut);
      chargerTicket();
      alert(`Statut changé en ${statut}`);
    } catch (error) {
      alert('Erreur lors du changement de statut');
    }
  };

  const handleAjouterTemps = async (e) => {
    e.preventDefault();
    if (!tempsValue || parseFloat(tempsValue) <= 0) {
      alert('Veuillez saisir un nombre d\'heures valide');
      return;
    }
    try {
      await ticketService.ajouterTemps(id, parseFloat(tempsValue));
      setTempsValue('');
      setShowTempsForm(false);
      chargerTicket();
      alert('Temps ajouté');
    } catch (error) {
      alert('Erreur lors de l\'ajout du temps');
    }
  };

  const handleAjouterSolution = async (e) => {
    e.preventDefault();
    if (!solutionValue) {
      alert('Veuillez saisir une solution');
      return;
    }
    try {
      await ticketService.ajouterSolution(id, solutionValue);
      setSolutionValue('');
      setShowSolutionForm(false);
      chargerTicket();
      alert('Solution ajoutée');
    } catch (error) {
      alert('Erreur lors de l\'ajout de la solution');
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
  if (!ticket) return <div>Ticket non trouvé</div>;

  const statut = getStatutBadge(ticket.statut);
  const priorite = getPrioriteBadge(ticket.priorite);
  const estFerme = ticket.statut === 'ferme';
  const numero = ticket.numero || ticket.id;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <Button variant="outline" onClick={() => navigate('/tickets')}>
          <FaArrowLeft /> Retour
        </Button>
        <h1>Ticket N°{numero} - {ticket.titre}</h1>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <span style={{ backgroundColor: statut.bg, color: statut.color, padding: '4px 12px', borderRadius: '16px' }}>{statut.label}</span>
          <span style={{ backgroundColor: priorite.bg, color: priorite.color, padding: '4px 12px', borderRadius: '16px' }}>{priorite.label}</span>
        </div>

        <p><strong>Description:</strong></p>
        <p>{ticket.description}</p>

        <p><strong>Client:</strong> {ticket.client_name || '-'}</p>
        <p><strong>Technicien assigné:</strong> {ticket.technicien_nom || 'Non assigné'}</p>
        <p><strong>Créé par:</strong> {ticket.cree_par_nom} le {new Date(ticket.date_creation).toLocaleString()}</p>
        <p><strong>Temps passé:</strong> {ticket.temps_passe} heures</p>
        {ticket.solution && <p><strong>Solution:</strong> {ticket.solution}</p>}

        {/* Actions */}
        {!estFerme && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
            <h3>Actions</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {canAssign && ticket.statut === 'nouveau' && (
                <select onChange={(e) => handleAssigner(e.target.value)} defaultValue="" style={{ padding: '0.5rem' }}>
                  <option value="">Assigner un technicien</option>
                  {techniciens.map(t => (
                    <option key={t.id} value={t.id}>{t.username}</option>
                  ))}
                </select>
              )}
              {ticket.statut === 'nouveau' && (
                <Button size="small" variant="primary" onClick={() => handleChangerStatut('en_cours')}>Prendre en charge</Button>
              )}
              {ticket.statut === 'en_cours' && (
                <Button size="small" variant="success" onClick={() => handleChangerStatut('resolu')}>Marquer comme résolu</Button>
              )}
              {ticket.statut === 'resolu' && isManagerOrAdmin && (
                <Button size="small" variant="secondary" onClick={() => handleChangerStatut('ferme')}>Fermer</Button>
              )}
            </div>

            {canAddTime && ticket.statut !== 'ferme' && (
              <div style={{ marginBottom: '1rem' }}>
                {!showTempsForm ? (
                  <Button size="small" variant="outline" onClick={() => setShowTempsForm(true)}><FaClock /> Ajouter du temps</Button>
                ) : (
                  <form onSubmit={handleAjouterTemps} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Input type="number" step="0.5" value={tempsValue} onChange={(e) => setTempsValue(e.target.value)} placeholder="Heures" style={{ width: '100px' }} required />
                    <Button type="submit" size="small" variant="primary">Ajouter</Button>
                    <Button type="button" size="small" variant="outline" onClick={() => setShowTempsForm(false)}>Annuler</Button>
                  </form>
                )}
              </div>
            )}

            {canAddSolution && ticket.statut !== 'ferme' && !ticket.solution && (
              <div>
                {!showSolutionForm ? (
                  <Button size="small" variant="outline" onClick={() => setShowSolutionForm(true)}><FaCheckCircle /> Ajouter une solution</Button>
                ) : (
                  <form onSubmit={handleAjouterSolution}>
                    <Input textarea value={solutionValue} onChange={(e) => setSolutionValue(e.target.value)} placeholder="Décrivez la solution..." rows="3" required />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <Button type="submit" size="small" variant="primary">Enregistrer</Button>
                      <Button type="button" size="small" variant="outline" onClick={() => setShowSolutionForm(false)}>Annuler</Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* Historique */}
        {ticket.historique && ticket.historique.length > 0 && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
            <h3>Historique</h3>
            {ticket.historique.map((h, idx) => (
              <div key={idx} style={{ padding: '0.5rem', backgroundColor: '#f9fafb', marginBottom: '0.5rem', borderRadius: '4px' }}>
                <p style={{ margin: 0 }}><strong>{h.action}</strong> - par {h.utilisateur_name}</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{h.details}</p>
                <small style={{ color: '#999' }}>{new Date(h.date_action).toLocaleString()}</small>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default TicketDetail;