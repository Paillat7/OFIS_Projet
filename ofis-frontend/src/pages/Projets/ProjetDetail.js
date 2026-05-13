import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { FaArrowLeft, FaTrash, FaPlus, FaHistory, FaChartLine, FaClock, FaBell } from 'react-icons/fa';
import { projetService } from '../../services/projetService';
import api from '../../services/api';
import { authService } from '../../services/authService';

const ProjetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projet, setProjet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [heures, setHeures] = useState([]);
  const [techniciens, setTechniciens] = useState([]);
  const [tauxHoraires, setTauxHoraires] = useState({});
  const [alertes, setAlertes] = useState([]);
  const [impactRetard, setImpactRetard] = useState(null);
  const [showHeureForm, setShowHeureForm] = useState(false);
  const [heureForm, setHeureForm] = useState({ 
    intervenant: '', 
    date: '', 
    heure_debut: '',
    heure_fin: '',
    heures: '', 
    description: '' 
  });
  const user = authService.getCurrentUser();
  const isAdminOrManager = user?.role === 'manager' || user?.role === 'admin';

  useEffect(() => {
    chargerProjet();
    chargerHeures();
    chargerTechniciens();
    chargerTauxHoraires();
    chargerAlertes();
    chargerImpactRetard();
  }, [id]);

  const chargerProjet = async () => {
    try {
      const data = await projetService.getById(id);
      setProjet(data);
    } catch (error) {
      console.error('Erreur chargement projet', error);
    } finally {
      setLoading(false);
    }
  };

  const chargerHeures = async () => {
    try {
      const data = await projetService.getHeures(id);
      setHeures(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement heures', error);
      setHeures([]);
    }
  };

  const chargerTechniciens = async () => {
    try {
      const users = await api.getUsers();
      const techniciensData = users.filter(u => !u.is_staff && !u.is_superuser && u.role !== 'cadre');
      setTechniciens(techniciensData);
    } catch (error) {
      console.error('Erreur chargement techniciens', error);
    }
  };

  const chargerTauxHoraires = async () => {
    try {
      const data = await api.getTechnicians();
      const tauxMap = {};
      data.forEach(tech => {
        tauxMap[tech.user_id] = tech.taux_horaire || 0;
      });
      setTauxHoraires(tauxMap);
    } catch (error) {
      console.error('Erreur chargement taux horaires:', error);
    }
  };

  const chargerAlertes = async () => {
    try {
      const data = await api.get(`/projets/${id}/verifier_alertes/`);
      setAlertes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
      setAlertes([]);
    }
  };

  const chargerImpactRetard = async () => {
    try {
      const data = await api.get(`/projets/${id}/impact_retard/`);
      if (data && data.jours_retard) {
        setImpactRetard(data);
      }
    } catch (error) {
      console.error('Erreur chargement impact retard:', error);
    }
  };

  const calculerHeuresAuto = (debut, fin) => {
    if (!debut || !fin) return null;
    const [debutH, debutM] = debut.split(':');
    const [finH, finM] = fin.split(':');
    const debutMinutes = parseInt(debutH) * 60 + parseInt(debutM);
    const finMinutes = parseInt(finH) * 60 + parseInt(finM);
    const duree = (finMinutes - debutMinutes) / 60;
    return duree > 0 ? duree.toFixed(1) : null;
  };

  const ajouterHeure = async (e) => {
    e.preventDefault();
    
    let heuresValue = heureForm.heures;
    if (heureForm.heure_debut && heureForm.heure_fin) {
      const calcule = calculerHeuresAuto(heureForm.heure_debut, heureForm.heure_fin);
      if (calcule) {
        heuresValue = calcule;
      }
    }
    
    if (!heureForm.intervenant || !heureForm.date || !heuresValue || parseFloat(heuresValue) <= 0) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    try {
      const dataToSend = {
        intervenant: parseInt(heureForm.intervenant),
        date: heureForm.date,
        heure_debut: heureForm.heure_debut || null,
        heure_fin: heureForm.heure_fin || null,
        heures: parseFloat(heuresValue),
        description: heureForm.description
      };
      await projetService.ajouterHeures(id, dataToSend);
      setHeureForm({ intervenant: '', date: '', heure_debut: '', heure_fin: '', heures: '', description: '' });
      setShowHeureForm(false);
      chargerProjet();
      chargerHeures();
      chargerAlertes();
      chargerImpactRetard();
      alert('Heures ajoutées avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'ajout des heures');
    }
  };

  const ajouterIntervenant = async (intervenantId) => {
    if (!intervenantId) return;
    try {
      await projetService.ajouterIntervenant(id, intervenantId);
      chargerProjet();
      alert('Intervenant ajouté avec succès');
    } catch (error) {
      alert('Erreur lors de l\'ajout de l\'intervenant');
    }
  };

  const retirerIntervenant = async (intervenantId) => {
    if (!window.confirm('Retirer cet intervenant du projet ?')) return;
    try {
      await projetService.retirerIntervenant(id, intervenantId);
      chargerProjet();
      alert('Intervenant retiré');
    } catch (error) {
      alert('Erreur lors du retrait de l\'intervenant');
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (!projet) return <div>Projet non trouvé</div>;

  const isChefProjet = user?.id === projet.chef_projet;
  const canManage = isAdminOrManager || isChefProjet;

  const totalHeures = heures.reduce((sum, h) => sum + parseFloat(h.heures), 0);
  const reste = projet.estimation_heures - totalHeures;
  const avancement = projet.estimation_heures > 0 ? (totalHeures / projet.estimation_heures) * 100 : 0;
  
  const coutTotalHeures = heures.reduce((total, h) => {
    const taux = tauxHoraires[h.intervenant] || 0;
    return total + (h.heures * taux);
  }, 0);
  
  let derniereDateSaisie = null;
  if (heures.length > 0) {
    const dates = heures.map(h => new Date(h.date));
    derniereDateSaisie = new Date(Math.max(...dates));
    derniereDateSaisie.setHours(0, 0, 0, 0);
  }
  
  const dateFinPrevue = projet.date_fin ? new Date(projet.date_fin) : null;
  if (dateFinPrevue) {
    dateFinPrevue.setHours(0, 0, 0, 0);
  }
  
  const estEnRetardDelai = dateFinPrevue && derniereDateSaisie && derniereDateSaisie > dateFinPrevue;
  const estEnDepassementHeures = totalHeures > projet.estimation_heures;
  const estEnProbleme = estEnRetardDelai || estEnDepassementHeures;
  
  let statutMessage = '';
  let statutCouleur = '#4caf50';
  if (estEnRetardDelai && estEnDepassementHeures) {
    statutMessage = 'Retard (délai dépassé) + Dépassement de ' + (totalHeures - projet.estimation_heures).toFixed(1) + 'h';
    statutCouleur = '#ef4444';
  } else if (estEnRetardDelai) {
    statutMessage = 'Retard (délai dépassé)';
    statutCouleur = '#ef4444';
  } else if (estEnDepassementHeures) {
    statutMessage = 'Dépassement de ' + (totalHeures - projet.estimation_heures).toFixed(1) + 'h (délai OK)';
    statutCouleur = '#f59e0b';
  } else {
    statutMessage = 'Dans les temps';
    statutCouleur = '#4caf50';
  }

  const coutProjet = parseFloat(projet.cout_projet) || 0;
  const beneficeAttendu = parseFloat(projet.benefice_attendu) || 0;
  const margeAttendue = coutProjet > 0 ? (beneficeAttendu / coutProjet) * 100 : 0;

  let beneficeReelEstime = beneficeAttendu;
  let pourcentageBenefice = 100;

  if (coutProjet > 0 && beneficeAttendu > 0) {
    if (avancement > 100) {
      const pourcentageDepassement = avancement - 100;
      beneficeReelEstime = beneficeAttendu * (1 - pourcentageDepassement / 100);
      beneficeReelEstime = Math.max(0, beneficeReelEstime);
      pourcentageBenefice = (beneficeReelEstime / beneficeAttendu) * 100;
    } else {
      beneficeReelEstime = (beneficeAttendu * avancement) / 100;
      pourcentageBenefice = avancement;
    }
  }

  const estRentable = beneficeReelEstime > 0;
  
  let rentabiliteMessage = '';
  if (coutProjet > 0 && beneficeAttendu > 0) {
    if (avancement > 100) {
      const perte = beneficeAttendu - beneficeReelEstime;
      rentabiliteMessage = 'ALERTE : Dépassement de ' + (avancement - 100).toFixed(0) + '%. Pénalité de ' + perte.toLocaleString('fr-FR') + ' XAF. Bénéfice réduit à ' + beneficeReelEstime.toLocaleString('fr-FR') + ' XAF.';
    } else if (avancement > 50) {
      rentabiliteMessage = 'Attention : ' + avancement.toFixed(0) + '% d\'avancement, bénéfice de ' + beneficeReelEstime.toLocaleString('fr-FR') + ' XAF / ' + beneficeAttendu.toLocaleString('fr-FR') + ' XAF attendus.';
    } else {
      rentabiliteMessage = 'Sur la bonne voie : ' + avancement.toFixed(0) + '% d\'avancement, bénéfice de ' + beneficeReelEstime.toLocaleString('fr-FR') + ' XAF / ' + beneficeAttendu.toLocaleString('fr-FR') + ' XAF attendus.';
    }
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Retour
        </Button>
        <h1>{projet.nom}</h1>
      </div>

      {alertes.length > 0 && (
        <Card style={{ backgroundColor: '#fee2e2', borderLeft: '4px solid #ef4444', marginBottom: '1rem' }}>
          <h3 style={{ color: '#ef4444', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaBell /> Alertes projet
          </h3>
          {alertes.map((alerte, idx) => (
            <p key={idx} style={{ margin: '0.25rem 0' }}>
              {alerte.message}
            </p>
          ))}
        </Card>
      )}

      {impactRetard && impactRetard.jours_retard > 0 && (
        <Card style={{ 
          backgroundColor: impactRetard.est_critique ? '#fee2e2' : '#fef3c7', 
          borderLeft: `4px solid ${impactRetard.est_critique ? '#ef4444' : '#f59e0b'}`
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: impactRetard.est_critique ? '#ef4444' : '#d97706' }}>
            Impact du retard ({impactRetard.jours_retard} jour{impactRetard.jours_retard > 1 ? 's' : ''})
          </h3>
          <p style={{ margin: '0.25rem 0' }}>
            <strong>Perte sur marge :</strong> -{impactRetard.perte_marge}%
          </p>
          <p style={{ margin: '0.25rem 0' }}>
            <strong>Bénéfice réel estimé :</strong> {impactRetard.nouveau_benefice?.toLocaleString('fr-FR') || '0'} FCFA
          </p>
          <p style={{ margin: '0.25rem 0' }}>
            <strong>Marge réelle :</strong> {impactRetard.nouvelle_marge}%
            {impactRetard.est_critique && (
              <span style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '0.5rem' }}>
                EN DESSOUS DU SEUIL DE RENTABILITE (15%)
              </span>
            )}
          </p>
        </Card>
      )}

      <Card style={{ backgroundColor: estEnProbleme ? '#fee2e2' : '#e8f5e9', borderLeft: '4px solid ' + (estEnProbleme ? '#ef4444' : '#4caf50') }}>
        <p><strong>Chef de projet :</strong> {projet.chef_projet_name}</p>
        <p><strong>Description :</strong> {projet.description || '-'}</p>
        <p><strong>Estimation :</strong> {projet.estimation_heures} h</p>
        <p><strong>Heures consommees :</strong> <span style={{ color: estEnDepassementHeures ? '#ef4444' : '#4caf50', fontWeight: 'bold' }}>{totalHeures} h</span></p>
        <p><strong>Reste :</strong> <span style={{ color: reste < 0 ? '#ef4444' : '#4caf50', fontWeight: 'bold' }}>{reste} h</span></p>
        <p><strong>Avancement :</strong> {Math.min(100, Math.max(0, avancement)).toFixed(0)}%</p>
        <p><strong>Statut :</strong> {projet.statut === 'en_cours' ? 'En cours' : projet.statut === 'termine' ? 'Termine' : 'Suspendu'}</p>
        <p><strong>Date debut :</strong> {new Date(projet.date_debut).toLocaleDateString()}</p>
        <p><strong>Date fin prevue :</strong> {projet.date_fin ? new Date(projet.date_fin).toLocaleDateString() : 'Non definie'}</p>
        {coutTotalHeures > 0 && (
          <p><strong>Coût des heures :</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>{coutTotalHeures.toLocaleString('fr-FR')} FCFA</span></p>
        )}
        {projet.cout_projet && <p><strong>Coût du projet :</strong> {coutProjet.toLocaleString('fr-FR')} {projet.devise_cout || 'XAF'}</p>}
        {projet.benefice_attendu && <p><strong>Bénéfice attendu :</strong> {beneficeAttendu.toLocaleString('fr-FR')} {projet.devise_benefice || 'XAF'}</p>}
        <p><strong>Statut projet :</strong> <span style={{ color: statutCouleur, fontWeight: 'bold' }}>{statutMessage}</span></p>
      </Card>

      {(coutProjet > 0 || beneficeAttendu > 0) && (
        <Card>
          <h3><FaChartLine /> Rentabilite financiere</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <p><strong>Coût du projet :</strong></p>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{coutProjet.toLocaleString('fr-FR')} {projet.devise_cout || 'XAF'}</p>
            </div>
            <div>
              <p><strong>Bénéfice attendu :</strong></p>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>{beneficeAttendu.toLocaleString('fr-FR')} {projet.devise_benefice || 'XAF'}</p>
            </div>
            <div>
              <p><strong>Marge attendue :</strong></p>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{margeAttendue.toFixed(1)}%</p>
            </div>
            <div>
              <p><strong>Bénéfice reel estime :</strong></p>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: beneficeReelEstime > 0 ? (beneficeReelEstime === beneficeAttendu ? '#10b981' : '#f59e0b') : '#ef4444' }}>
                {beneficeReelEstime.toLocaleString('fr-FR')} {projet.devise_benefice || 'XAF'}
              </p>
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <p><strong>Progression du bénéfice vs Avancement :</strong></p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ height: '20px', backgroundColor: '#e0e0e0', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ width: Math.min(100, avancement) + '%', height: '100%', backgroundColor: '#3b82f6', textAlign: 'center', color: 'white', fontSize: '0.7rem', lineHeight: '20px' }}>
                    {Math.min(100, avancement).toFixed(0)}%
                  </div>
                </div>
                <p style={{ margin: '0.25rem 0', fontSize: '0.75rem', textAlign: 'center' }}>Avancement projet</p>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: '20px', backgroundColor: '#e0e0e0', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ width: Math.min(100, pourcentageBenefice) + '%', height: '100%', backgroundColor: '#10b981', textAlign: 'center', color: 'white', fontSize: '0.7rem', lineHeight: '20px' }}>
                    {Math.min(100, pourcentageBenefice).toFixed(0)}%
                  </div>
                </div>
                <p style={{ margin: '0.25rem 0', fontSize: '0.75rem', textAlign: 'center' }}>Progression bénéfice</p>
              </div>
            </div>
          </div>

          {rentabiliteMessage && (
            <p style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: !estRentable ? '#fee2e2' : '#e8f5e9', borderRadius: '4px', color: !estRentable ? '#ef4444' : '#f59e0b', fontWeight: 'bold' }}>
              {rentabiliteMessage}
            </p>
          )}
        </Card>
      )}

      <Card>
        <h3>Equipe du projet</h3>
        {projet.intervenants_names?.length === 0 ? <p>Aucun intervenant assigne</p> : (
          <ul>
            {projet.intervenants_names?.map((name, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span> {name}</span>
                {canManage && <Button size="small" variant="danger" onClick={() => retirerIntervenant(projet.intervenants_ids[idx])}><FaTrash /> Retirer</Button>}
              </li>
            ))}
          </ul>
        )}
        {canManage && (
          <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
            <label>Ajouter un intervenant : </label>
            <select onChange={(e) => ajouterIntervenant(e.target.value)} defaultValue="" style={{ padding: '0.5rem', marginLeft: '0.5rem' }}>
              <option value="">-- Selectionner --</option>
              {techniciens.filter(t => !projet.intervenants_ids?.includes(t.id)).map(t => <option key={t.id} value={t.id}>{t.username}</option>)}
            </select>
          </div>
        )}

        <h3><FaClock /> Suivi du temps (Timesheet)</h3>
        {canManage && (
          <div style={{ marginBottom: '1rem' }}>
            {!showHeureForm ? (
              <Button variant="primary" size="small" onClick={() => setShowHeureForm(true)}>
                <FaPlus /> Saisir des heures
              </Button>
            ) : (
              <form onSubmit={ajouterHeure} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', backgroundColor: '#f9f9f9' }}>
                <h4>Saisie des heures travaillees</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label>Intervenant *</label>
                    <select 
                      value={heureForm.intervenant} 
                      onChange={(e) => setHeureForm({ ...heureForm, intervenant: e.target.value })} 
                      required
                      style={{ width: '100%', padding: '0.5rem' }}
                    >
                      <option value="">Selectionner</option>
                      {projet.intervenants_ids?.map((id, idx) => (
                        <option key={id} value={id}>{projet.intervenants_names?.[idx]}</option>
                      ))}
                    </select>
                  </div>
                  <Input 
                    label="Date *" 
                    type="date" 
                    value={heureForm.date} 
                    onChange={(e) => setHeureForm({ ...heureForm, date: e.target.value })} 
                    required 
                  />
                  <Input 
                    label="Heure debut" 
                    type="time" 
                    value={heureForm.heure_debut} 
                    onChange={(e) => setHeureForm({ ...heureForm, heure_debut: e.target.value })} 
                    placeholder="HH:MM"
                  />
                  <Input 
                    label="Heure fin" 
                    type="time" 
                    value={heureForm.heure_fin} 
                    onChange={(e) => setHeureForm({ ...heureForm, heure_fin: e.target.value })} 
                    placeholder="HH:MM"
                  />
                  <Input 
                    label="Heures travaillees" 
                    type="number" 
                    step="0.5" 
                    value={heureForm.heures} 
                    onChange={(e) => setHeureForm({ ...heureForm, heures: e.target.value })} 
                    placeholder="Ou laissez vide pour calcul auto"
                  />
                </div>
                <Input 
                  label="Description" 
                  textarea 
                  value={heureForm.description} 
                  onChange={(e) => setHeureForm({ ...heureForm, description: e.target.value })} 
                  rows="2" 
                />
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <Button type="submit" variant="primary" size="small">Enregistrer</Button>
                  <Button type="button" variant="outline" size="small" onClick={() => { setShowHeureForm(false); setHeureForm({ intervenant: '', date: '', heure_debut: '', heure_fin: '', heures: '', description: '' }); }}>
                    Annuler
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {heures.length === 0 ? (
          <p>Aucune heure saisie pour le moment.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Intervenant</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Debut</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Fin</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Heures</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Coût</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {heures.map(h => {
                const taux = tauxHoraires[h.intervenant] || 0;
                const cout = (h.heures * taux).toLocaleString('fr-FR');
                return (
                  <tr key={h.id}>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{new Date(h.date).toLocaleDateString()}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{h.intervenant_name}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{h.heure_debut || '-'}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{h.heure_fin || '-'}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{h.heures} h</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{cout} FCFA</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{h.description || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#e9ecef', fontWeight: 'bold' }}>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>Total</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}></td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}></td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}></td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{totalHeures} h / {projet.estimation_heures} h</td>
                <td style={{ padding: '8px', border: '1px solid #ddd', color: '#10b981', fontWeight: 'bold' }}>
                  {coutTotalHeures.toLocaleString('fr-FR')} FCFA
                </td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}></td>
              </tr>
            </tfoot>
          </table>
        )}

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <Link to={`/projets/${projet.id}/historique`}>
            <Button variant="outline" size="small"><FaHistory /> Voir l'historique complet</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ProjetDetail;