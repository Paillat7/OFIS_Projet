import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { ticketService } from '../../services/ticketService';
import api from '../../services/api';
import { FaArrowLeft } from 'react-icons/fa';

const TicketForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [techniciens, setTechniciens] = useState([]);
  const [form, setForm] = useState({
    titre: '',
    description: '',
    client: '',
    priorite: 'moyenne',
    statut: 'nouveau',
  });

  useEffect(() => {
    chargerClients();
    chargerTechniciens();
    if (id) chargerTicket();
  }, [id]);

  const chargerClients = async () => {
    try {
      const data = await api.getClients();
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
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

  const chargerTicket = async () => {
    setLoading(true);
    try {
      const data = await ticketService.getById(id);
      setForm({
        titre: data.titre || '',
        description: data.description || '',
        client: data.client || '',
        priorite: data.priorite || 'moyenne',
        statut: data.statut || 'nouveau',
      });
    } catch (error) {
      console.error('Erreur chargement ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await ticketService.update(id, form);
      } else {
        await ticketService.create(form);
      }
      navigate('/tickets');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <Button variant="outline" onClick={() => navigate('/tickets')}>
          <FaArrowLeft /> Retour
        </Button>
        <h1>{id ? 'Modifier le ticket' : 'Nouveau ticket'}</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <Input
            label="Titre *"
            name="titre"
            value={form.titre}
            onChange={handleChange}
            required
          />
          <Input
            label="Description *"
            name="description"
            textarea
            value={form.description}
            onChange={handleChange}
            rows="4"
            required
          />
          <div className="form-group">
            <label>Client *</label>
            <select name="client" value={form.client} onChange={handleChange} required style={{ width: '100%', padding: '0.5rem' }}>
              <option value="">Sélectionner un client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.company || `${c.firstName} ${c.lastName}`}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Priorité *</label>
            <select name="priorite" value={form.priorite} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }}>
              <option value="basse">Basse</option>
              <option value="moyenne">Moyenne</option>
              <option value="haute">Haute</option>
              <option value="critique">Critique</option>
            </select>
          </div>
          {id && (
            <div className="form-group">
              <label>Statut</label>
              <select name="statut" value={form.statut} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }}>
                <option value="nouveau">Nouveau</option>
                <option value="en_cours">En cours</option>
                <option value="resolu">Résolu</option>
                <option value="ferme">Fermé</option>
              </select>
            </div>
          )}
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/tickets')}>
              Annuler
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default TicketForm;