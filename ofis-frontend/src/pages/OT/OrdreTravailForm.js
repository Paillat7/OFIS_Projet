import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { otService } from '../../services/otService';
import api from '../../services/api';
import { FaArrowLeft } from 'react-icons/fa';

const OrdreTravailForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [techniciens, setTechniciens] = useState([]);
  const [form, setForm] = useState({
    reference: '',           // Numéro OT (saisie manuelle)
    reference_externe: '',   // Bon de commande client
    objet: '',
    lieu: '',
    client_rapport: '',
    techniciens_ids: [],
    estimation_heures: '',
  });

  useEffect(() => {
    chargerDonnees();
    if (id) chargerOT();
  }, [id]);

  const chargerDonnees = async () => {
    try {
      const clientsData = await api.getClients();
      setClients(clientsData);
      const usersData = await api.getUsers();
      const techniciensData = usersData.filter(u => !u.is_staff && !u.is_superuser);
      setTechniciens(techniciensData);
    } catch (error) {
      console.error('Erreur chargement données', error);
    }
  };

  const chargerOT = async () => {
    setLoading(true);
    try {
      const data = await otService.getById(id);
      setForm({
        reference: data.reference || '',
        reference_externe: data.reference_externe || '',
        objet: data.objet || '',
        lieu: data.lieu || '',
        client_rapport: data.client_rapport || '',
        techniciens_ids: data.techniciens_ids || [],
        estimation_heures: data.estimation_heures || '',
      });
    } catch (error) {
      console.error('Erreur chargement OT', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTechniciensChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(parseInt(options[i].value));
      }
    }
    setForm(prev => ({ ...prev, techniciens_ids: selected }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await otService.update(id, form);
      } else {
        await otService.create(form);
      }
      navigate('/ot-en-cours');
    } catch (error) {
      console.error('Erreur sauvegarde', error);
      alert('Erreur : ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Retour
        </Button>
        <h1>{id ? 'Modifier' : 'Nouvel'} ordre de travail</h1>
      </div>
      <Card>
        <form onSubmit={handleSubmit}>
          {/* 1. Numéro OT (saisie manuelle) */}
          <Input
            label="Numéro OT *"
            name="reference"
            value={form.reference}
            onChange={handleChange}
            placeholder="ex: OT-2026-00123"
            required
          />

          {/* 2. Référence bon de commande client */}
          <Input
            label="Référence bon de commande client"
            name="reference_externe"
            value={form.reference_externe}
            onChange={handleChange}
            placeholder="ex: BC-2026-001"
          />

          {/* 3. Objet de l'intervention */}
          <Input
            label="Objet de l'intervention *"
            name="objet"
            value={form.objet}
            onChange={handleChange}
            required
          />

          {/* 4. Lieu */}
          <Input
            label="Lieu"
            name="lieu"
            value={form.lieu}
            onChange={handleChange}
          />

          {/* 5. Client */}
          <div className="form-group">
            <label>Client *</label>
            <select
              name="client_rapport"
              value={form.client_rapport}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner un client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.company} - {c.firstName} {c.lastName}</option>
              ))}
            </select>
          </div>

          {/* 6. Techniciens assignés */}
          <div className="form-group">
            <label>Techniciens assignés *</label>
            <select
              multiple
              value={form.techniciens_ids}
              onChange={handleTechniciensChange}
              style={{ height: '120px' }}
              required
            >
              {techniciens.map(t => (
                <option key={t.id} value={t.id}>{t.username} ({t.first_name} {t.last_name})</option>
              ))}
            </select>
            <small style={{ color: '#666' }}>Maintenez Ctrl pour sélectionner plusieurs techniciens</small>
          </div>

          {/* 7. Estimation (heures) */}
          <Input
            label="Estimation (heures)"
            name="estimation_heures"
            type="number"
            step="0.5"
            value={form.estimation_heures}
            onChange={handleChange}
          />

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Annuler
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default OrdreTravailForm;