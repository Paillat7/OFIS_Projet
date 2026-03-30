import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { rapportService } from '../../services/rapportService';
import { authService } from '../../services/authService';
import api from '../../services/api';
import { FaArrowLeft } from 'react-icons/fa';
import './Rapports.css';

const RapportJournalierForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const user = authService.getCurrentUser();

  const [form, setForm] = useState({
    client: '',
    service: '',          // ← NOUVEAU CHAMP
    heure_depart: '',
    heure_arrivee: '',
    heure_rdv: '',
    type_intervention: '',
    rdv_planifie: true,
    description: '',
    rit_signe: false,
    pv_signe: false,
    conclusions: '',
  });

  useEffect(() => {
    chargerClients();
    if (id) chargerRapport();
  }, [id]);

  const chargerClients = async () => {
    setLoading(true);
    try {
      const clientsData = await api.getClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Erreur chargement clients', error);
    } finally {
      setLoading(false);
    }
  };

  const chargerRapport = async () => {
    try {
      const data = await rapportService.getJournalier(id);
      setForm({
        client: data.client || '',
        service: data.service || '',          // ← AJOUT
        heure_depart: data.heure_depart || '',
        heure_arrivee: data.heure_arrivee || '',
        heure_rdv: data.heure_rdv || '',
        type_intervention: data.type_intervention || '',
        rdv_planifie: data.rdv_planifie ?? true,
        description: data.description || '',
        rit_signe: data.rit_signe || false,
        pv_signe: data.pv_signe || false,
        conclusions: data.conclusions || '',
      });
    } catch (error) {
      console.error('Erreur chargement rapport', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (id) {
        await rapportService.updateJournalier(id, form);
      } else {
        await rapportService.createJournalier(form);
      }
      navigate('/rapports/journalier');
    } catch (error) {
      console.error('Erreur sauvegarde', error);
      alert('Erreur: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Retour
        </Button>
        <h1 style={{ margin: 0 }}>{id ? 'Modifier' : 'Nouveau'} rapport journalier</h1>
      </div>
      <Card>
        <form onSubmit={handleSubmit}>
          {/* Client */}
          <div className="form-group">
            <label>Client concerné</label>
            <select
              name="client"
              value={form.client}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner un client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} - {c.company}
                </option>
              ))}
            </select>
          </div>

          {/* Service (obligatoire) */}
          <div className="form-group">
            <label>Service</label>
            <select
              name="service"
              value={form.service}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner un service</option>
              <option value="OSN">OSN</option>
              <option value="OBT">OBT</option>
            </select>
          </div>

          {/* Heures */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <Input
              label="Heure départ"
              type="time"
              name="heure_depart"
              value={form.heure_depart}
              onChange={handleChange}
              required
            />
            <Input
              label="Heure arrivée"
              type="time"
              name="heure_arrivee"
              value={form.heure_arrivee}
              onChange={handleChange}
              required
            />
            <Input
              label="Heure RDV"
              type="time"
              name="heure_rdv"
              value={form.heure_rdv}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="Type d'intervention"
            name="type_intervention"
            value={form.type_intervention}
            onChange={handleChange}
            placeholder="Ex: Projet/Contrôle d'accès"
            required
          />

          <div className="form-checkboxes">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="rdv_planifie"
                checked={form.rdv_planifie}
                onChange={handleChange}
              />
              RDV planifié ?
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="rit_signe"
                checked={form.rit_signe}
                onChange={handleChange}
              />
              RIT signé ?
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="pv_signe"
                checked={form.pv_signe}
                onChange={handleChange}
              />
              PV signé ?
            </label>
          </div>

          <Input
            label="Description du travail effectué"
            textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="6"
            required
            placeholder="Décrivez le travail effectué..."
          />

          <Input
            label="Conclusions"
            textarea
            name="conclusions"
            value={form.conclusions}
            onChange={handleChange}
            rows="3"
          />

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <Button type="button" variant="outline" onClick={() => navigate('/rapports/journalier')}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default RapportJournalierForm;