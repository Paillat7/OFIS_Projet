import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Rapports.css';

const RapportJournalier = () => {
  const navigate = useNavigate();
  const [missions, setMissions] = useState([]);
  const [form, setForm] = useState({
    mission: '',
    heure_depart: '',
    heure_arrivee: '',
    heure_rdv: '',
    client: '',
    type_intervention: '',
    rdv_planifie: true,
    description: '',
    rit_signe: false,
    pv_signe: false,
    conclusions: ''
  });

  useEffect(() => {
    chargerMissions();
  }, []);

  const chargerMissions = async () => {
    try {
      const data = await api.getMissionsV2(); // à adapter selon votre service
      setMissions(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Appel API pour créer le rapport
      const response = await fetch('http://localhost:8000/api/rapports-journaliers/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ofis_token')}`
        },
        body: JSON.stringify(form)
      });
      if (response.ok) {
        alert('Rapport journalier enregistré');
        navigate('/rapports');
      } else {
        alert('Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Rapport journalier</h1>
      </div>
      <Card>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Mission</label>
            <select value={form.mission} onChange={(e) => setForm({...form, mission: e.target.value})} required>
              <option value="">Sélectionner une mission</option>
              {missions.map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>
          <Input label="Heure départ" type="time" value={form.heure_depart} onChange={(e) => setForm({...form, heure_depart: e.target.value})} required />
          <Input label="Heure arrivée" type="time" value={form.heure_arrivee} onChange={(e) => setForm({...form, heure_arrivee: e.target.value})} required />
          <Input label="Heure RDV" type="time" value={form.heure_rdv} onChange={(e) => setForm({...form, heure_rdv: e.target.value})} required />
          <div className="form-group">
            <label>Client</label>
            <select value={form.client} onChange={(e) => setForm({...form, client: e.target.value})} required>
              <option value="">Sélectionner un client</option>
              {/* à remplir dynamiquement */}
            </select>
          </div>
          <Input label="Type d'intervention" value={form.type_intervention} onChange={(e) => setForm({...form, type_intervention: e.target.value})} required />
          <div className="form-group">
            <label>RDV planifié ?</label>
            <input type="checkbox" checked={form.rdv_planifie} onChange={(e) => setForm({...form, rdv_planifie: e.target.checked})} />
          </div>
          <Input label="Description" textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} required />
          <div className="form-group">
            <label>RIT signé ?</label>
            <input type="checkbox" checked={form.rit_signe} onChange={(e) => setForm({...form, rit_signe: e.target.checked})} />
          </div>
          <div className="form-group">
            <label>PV signé ?</label>
            <input type="checkbox" checked={form.pv_signe} onChange={(e) => setForm({...form, pv_signe: e.target.checked})} />
          </div>
          <Input label="Conclusions" textarea value={form.conclusions} onChange={(e) => setForm({...form, conclusions: e.target.value})} />
          <Button type="submit" variant="primary">Enregistrer</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/rapports')}>Annuler</Button>
        </form>
      </Card>
    </div>
  );
};

export default RapportJournalier;