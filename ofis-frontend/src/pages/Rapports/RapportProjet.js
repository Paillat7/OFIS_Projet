import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useNavigate } from 'react-router-dom';

const RapportProjet = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    projet: '',
    avancement: 0,
    taches_realisees: '',
    prochaines_taches: '',
    remarques: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/rapports-projet/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ofis_token')}`
        },
        body: JSON.stringify(form)
      });
      if (response.ok) {
        alert('Rapport de projet enregistré');
        navigate('/rapports');
      } else {
        alert('Erreur');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Rapport de projet</h1>
      </div>
      <Card>
        <form onSubmit={handleSubmit}>
          <Input label="Nom du projet" value={form.projet} onChange={(e) => setForm({...form, projet: e.target.value})} required />
          <Input label="Avancement (%)" type="number" min="0" max="100" value={form.avancement} onChange={(e) => setForm({...form, avancement: e.target.value})} required />
          <Input label="Tâches réalisées" textarea value={form.taches_realisees} onChange={(e) => setForm({...form, taches_realisees: e.target.value})} required />
          <Input label="Prochaines tâches" textarea value={form.prochaines_taches} onChange={(e) => setForm({...form, prochaines_taches: e.target.value})} />
          <Input label="Remarques" textarea value={form.remarques} onChange={(e) => setForm({...form, remarques: e.target.value})} />
          <Button type="submit" variant="primary">Enregistrer</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/rapports')}>Annuler</Button>
        </form>
      </Card>
    </div>
  );
};

export default RapportProjet;