import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { FaArrowLeft } from 'react-icons/fa';
import { rapportService } from '../../services/rapportService';
import './RapportForm.css';

const RapportProjetForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    projet: '',
    avancement: 0,
    taches_realisees: '',
    prochaines_taches: '',
    remarques: '',
  });

  useEffect(() => {
    if (id) chargerRapport();
  }, [id]);

  const chargerRapport = async () => {
    try {
      const data = await rapportService.getProjet(id);
      setForm({
        projet: data.projet || '',
        avancement: data.avancement || 0,
        taches_realisees: data.taches_realisees || '',
        prochaines_taches: data.prochaines_taches || '',
        remarques: data.remarques || '',
      });
    } catch (error) {
      console.error('Erreur chargement rapport', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await rapportService.updateProjet(id, form);
      } else {
        await rapportService.createProjet(form);
      }
      navigate('/assistante/rapports?type=projet');
    } catch (error) {
      console.error('Erreur sauvegarde', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleBack = () => {
    navigate('/assistante/rapports?type=projet');
  };

  return (
    <div className="dashboard-page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Button variant="outline" onClick={handleBack} style={{ padding: '0.5rem' }}>
          <FaArrowLeft />
        </Button>
        <h1>{id ? 'Modifier' : 'Nouveau'} rapport de projet</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="rapport-form">
          <Input
            label="Nom du projet"
            name="projet"
            value={form.projet}
            onChange={handleChange}
            required
          />
          <Input
            label="Avancement (%)"
            type="number"
            min="0"
            max="100"
            name="avancement"
            value={form.avancement}
            onChange={handleChange}
            required
          />
          <Input
            label="Tâches réalisées"
            textarea
            name="taches_realisees"
            value={form.taches_realisees}
            onChange={handleChange}
            rows="4"
            required
          />
          <Input
            label="Prochaines tâches"
            textarea
            name="prochaines_taches"
            value={form.prochaines_taches}
            onChange={handleChange}
            rows="3"
          />
          <Input
            label="Remarques"
            textarea
            name="remarques"
            value={form.remarques}
            onChange={handleChange}
            rows="3"
          />
          <div className="form-actions">
            <Button type="button" variant="outline" onClick={handleBack}>
              Annuler
            </Button>
            <Button type="submit" variant="primary">
              Enregistrer
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default RapportProjetForm;