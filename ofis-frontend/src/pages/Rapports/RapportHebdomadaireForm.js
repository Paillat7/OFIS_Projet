import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { rapportService } from '../../services/rapportService';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import './Rapports.css';

const RapportHebdomadaireForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [techniciens, setTechniciens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const user = authService.getCurrentUser();
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  // Liste des jours
  const joursSemaine = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

  // État principal du formulaire
  const [form, setForm] = useState({
    cadre: user?.id,
    date_debut: '',
    date_fin: '',
    activites: '',
    objectifs_atteints: '',
    difficultes: '',
    propositions: '',
    planning: {
      lundi: '',
      mardi: '',
      mercredi: '',
      jeudi: '',
      vendredi: '',
      samedi: '',
      dimanche: ''
    }
  });

  // État pour les cases à cocher (jours actifs)
  const [joursActifs, setJoursActifs] = useState({
    lundi: true,
    mardi: true,
    mercredi: true,
    jeudi: true,
    vendredi: true,
    samedi: false,
    dimanche: false
  });

  useEffect(() => {
    if (isManager) {
      chargerTechniciens();
    }
    if (id) chargerRapport();
  }, [id, isManager]);

  const chargerTechniciens = async () => {
    try {
      const users = await userService.getAll();
      setTechniciens(users.filter(u => !u.is_staff && !u.is_superuser));
    } catch (error) {
      console.error('Erreur chargement techniciens', error);
    }
  };

  const chargerRapport = async () => {
    setLoading(true);
    try {
      const data = await rapportService.getHebdomadaire(id);
      
      // Découpage du planning texte en objet jours
      let planningObj = {
        lundi: '',
        mardi: '',
        mercredi: '',
        jeudi: '',
        vendredi: '',
        samedi: '',
        dimanche: ''
      };
      
      // Initialiser les jours actifs : on coche les jours qui ont du texte
      let actifs = { ...joursActifs };

      if (data.planning && typeof data.planning === 'string') {
        const lignes = data.planning.split('\n');
        let jourCourant = null;
        lignes.forEach(ligne => {
          const l = ligne.trim();
          if (l.startsWith('Lundi :')) jourCourant = 'lundi';
          else if (l.startsWith('Mardi :')) jourCourant = 'mardi';
          else if (l.startsWith('Mercredi :')) jourCourant = 'mercredi';
          else if (l.startsWith('Jeudi :')) jourCourant = 'jeudi';
          else if (l.startsWith('Vendredi :')) jourCourant = 'vendredi';
          else if (l.startsWith('Samedi :')) jourCourant = 'samedi';
          else if (l.startsWith('Dimanche :')) jourCourant = 'dimanche';
          else if (jourCourant && l) {
            planningObj[jourCourant] += (planningObj[jourCourant] ? '\n' : '') + l;
          }
        });

        // Marquer comme actifs les jours qui ont du contenu
        joursSemaine.forEach(jour => {
          if (planningObj[jour].trim() !== '') {
            actifs[jour] = true;
          }
        });
      }

      setJoursActifs(actifs);
      setForm({
        cadre: data.cadre || user?.id,
        date_debut: data.date_debut || '',
        date_fin: data.date_fin || '',
        activites: data.activites || '',
        objectifs_atteints: data.objectifs_atteints || '',
        difficultes: data.difficultes || '',
        propositions: data.propositions || '',
        planning: planningObj
      });
    } catch (error) {
      console.error('Erreur chargement rapport', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePlanningChange = (jour, value) => {
    setForm(prev => ({
      ...prev,
      planning: {
        ...prev.planning,
        [jour]: value
      }
    }));
  };

  const handleCheckboxChange = (jour) => {
    setJoursActifs(prev => ({
      ...prev,
      [jour]: !prev[jour]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Construire le planning uniquement avec les jours actifs et non vides
      const planningTexte = joursSemaine
        .filter(jour => joursActifs[jour] && form.planning[jour].trim() !== '')
        .map(jour => {
          const jourCapital = jour.charAt(0).toUpperCase() + jour.slice(1);
          return `${jourCapital} :\n${form.planning[jour]}`;
        })
        .join('\n\n');

      const dataToSend = {
        ...form,
        planning: planningTexte
      };

      if (id) {
        await rapportService.updateHebdomadaire(id, dataToSend);
      } else {
        await rapportService.createHebdomadaire(dataToSend);
      }
      navigate('/rapports/hebdomadaire');
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
      <div className="page-header">
        <h1>{id ? 'Modifier' : 'Nouveau'} rapport hebdomadaire</h1>
      </div>
      <Card>
        <form onSubmit={handleSubmit}>
          {isManager && (
            <div className="form-group">
              <label>Technicien concerné (optionnel)</label>
              <select
                name="cadre"
                value={form.cadre}
                onChange={handleChange}
              >
                <option value="">Moi-même</option>
                {techniciens.map(t => (
                  <option key={t.id} value={t.id}>{t.username}</option>
                ))}
              </select>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Date début"
              type="date"
              name="date_debut"
              value={form.date_debut}
              onChange={handleChange}
              required
            />
            <Input
              label="Date fin"
              type="date"
              name="date_fin"
              value={form.date_fin}
              onChange={handleChange}
              required
            />
          </div>

          {/* Section planning avec cases à cocher */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
              Planning prévisionnel (cochez les jours concernés)
            </label>
            {joursSemaine.map(jour => (
              <div key={jour} style={{ marginBottom: '0.5rem', border: '1px solid #eee', padding: '0.5rem', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <input
                    type="checkbox"
                    id={`check-${jour}`}
                    checked={joursActifs[jour]}
                    onChange={() => handleCheckboxChange(jour)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <label htmlFor={`check-${jour}`} style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {jour}
                  </label>
                </div>
                {joursActifs[jour] && (
                  <textarea
                    value={form.planning[jour]}
                    onChange={(e) => handlePlanningChange(jour, e.target.value)}
                    rows="2"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontFamily: 'inherit',
                      marginTop: '0.25rem'
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <Input
            label="Activités réalisées"
            textarea
            name="activites"
            value={form.activites}
            onChange={handleChange}
            rows="5"
            required
          />
          <Input
            label="Objectifs atteints"
            textarea
            name="objectifs_atteints"
            value={form.objectifs_atteints}
            onChange={handleChange}
            rows="3"
          />
          <Input
            label="Difficultés rencontrées"
            textarea
            name="difficultes"
            value={form.difficultes}
            onChange={handleChange}
            rows="3"
          />
          <Input
            label="Propositions"
            textarea
            name="propositions"
            value={form.propositions}
            onChange={handleChange}
            rows="3"
          />
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <Button type="button" variant="outline" onClick={() => navigate('/rapports/hebdomadaire')}>
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

export default RapportHebdomadaireForm;