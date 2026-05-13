import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { projetService } from '../../services/projetService';
import api from '../../services/api';
import { authService } from '../../services/authService';
import { FaArrowLeft } from 'react-icons/fa';

const ProjetForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [techniciens, setTechniciens] = useState([]);
  const [cadres, setCadres] = useState([]);
  const user = authService.getCurrentUser();
  const isAdminOrManager = user?.role === 'manager' || user?.role === 'admin';
  const isCadre = user?.role === 'cadre';
  const canCreate = isAdminOrManager || isCadre;
  
  const [form, setForm] = useState({
    nom: '',
    description: '',
    chef_projet: '',
    estimation_heures: '',
    date_debut: '',
    date_fin: '',
    statut: 'en_cours',
    intervenants_ids: [],
    cout_projet: '',
    devise_cout: 'XAF',
    benefice_attendu: '',
    devise_benefice: 'XAF'
  });

  useEffect(() => {
    chargerDonnees();
    if (id) chargerProjet();
  }, [id]);

  const chargerDonnees = async () => {
    try {
      const users = await api.getUsers();
      
      const cadresData = users.filter(u => u.role === 'cadre');
      setCadres(cadresData);
      
      const techniciensData = users.filter(u => 
        !u.is_staff && 
        !u.is_superuser && 
        u.role !== 'cadre' &&
        u.id !== form.chef_projet
      );
      setTechniciens(techniciensData);
    } catch (error) {
      console.error('Erreur chargement données', error);
    }
  };

  const chargerProjet = async () => {
    setLoading(true);
    try {
      const data = await projetService.getById(id);
      setForm({
        nom: data.nom || '',
        description: data.description || '',
        chef_projet: data.chef_projet || '',
        estimation_heures: data.estimation_heures || '',
        date_debut: data.date_debut || '',
        date_fin: data.date_fin || '',
        statut: data.statut || 'en_cours',
        intervenants_ids: data.intervenants_ids || [],
        cout_projet: data.cout_projet || '',
        devise_cout: data.devise_cout || 'XAF',
        benefice_attendu: data.benefice_attendu || '',
        devise_benefice: data.devise_benefice || 'XAF'
      });
    } catch (error) {
      console.error('Erreur chargement projet', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleIntervenantsChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(parseInt(options[i].value));
      }
    }
    setForm(prev => ({ ...prev, intervenants_ids: selected }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSend = {
        ...form,
        intervenants_ids: form.intervenants_ids || []
      };
      
      if (id) {
        await projetService.update(id, dataToSend);
      } else {
        await projetService.create(dataToSend);
      }
      navigate('/projets');
    } catch (error) {
      console.error('Erreur sauvegarde', error);
      alert('Erreur : ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="dashboard-page">
        <Card>
          <p style={{ color: 'red', textAlign: 'center', padding: '2rem' }}>
            Accès réservé aux managers, administrateurs et chefs de projet.
          </p>
          <Button variant="outline" onClick={() => navigate('/projets')}>
            Retour
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) return <div className="loading">Chargement...</div>;

  // Liste des devises par région
  const devisesParRegion = {
    afrique: [
      { code: 'XAF', label: 'Franc CFA (CEMAC) - XAF' },
      { code: 'XOF', label: 'Franc CFA (UEMOA) - XOF' },
      { code: 'ZAR', label: 'Rand - ZAR (Afrique du Sud)' },
      { code: 'MAD', label: 'Dirham - MAD (Maroc)' },
      { code: 'EGP', label: 'Livre - EGP (Égypte)' },
      { code: 'NGN', label: 'Naira - NGN (Nigéria)' },
    ],
    europe: [
      { code: 'EUR', label: 'Euro - EUR' },
      { code: 'GBP', label: 'Livre Sterling - GBP' },
      { code: 'CHF', label: 'Franc Suisse - CHF' },
    ],
    amerique: [
      { code: 'USD', label: 'Dollar US - USD' },
      { code: 'CAD', label: 'Dollar Canadien - CAD' },
      { code: 'BRL', label: 'Real - BRL (Brésil)' },
      { code: 'MXN', label: 'Peso - MXN (Mexique)' },
    ],
    asie: [
      { code: 'JPY', label: 'Yen - JPY (Japon)' },
      { code: 'CNY', label: 'Yuan - CNY (Chine)' },
      { code: 'INR', label: 'Roupie - INR (Inde)' },
      { code: 'KRW', label: 'Won - KRW (Corée du Sud)' },
      { code: 'THB', label: 'Baht - THB (Thaïlande)' },
      { code: 'SGD', label: 'Dollar - SGD (Singapour)' },
      { code: 'MYR', label: 'Ringgit - MYR (Malaisie)' },
      { code: 'IDR', label: 'Roupie - IDR (Indonésie)' },
      { code: 'PHP', label: 'Peso - PHP (Philippines)' },
      { code: 'VND', label: 'Dong - VND (Vietnam)' },
    ],
    moyenOrient: [
      { code: 'AED', label: 'Dirham - AED (EAU)' },
      { code: 'SAR', label: 'Riyal - SAR (Arabie Saoudite)' },
      { code: 'QAR', label: 'Riyal - QAR (Qatar)' },
      { code: 'KWD', label: 'Dinar - KWD (Koweït)' },
      { code: 'BHD', label: 'Dinar - BHD (Bahreïn)' },
    ],
    oceanie: [
      { code: 'AUD', label: 'Dollar Australien - AUD' },
      { code: 'NZD', label: 'Dollar Néo-Zélandais - NZD' },
    ],
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Retour
        </Button>
        <h1>{id ? 'Modifier' : 'Nouveau'} projet</h1>
      </div>
      <Card>
        <form onSubmit={handleSubmit}>
          <Input
            label="Nom du projet *"
            name="nom"
            value={form.nom}
            onChange={handleChange}
            required
          />

          <Input
            label="Description"
            name="description"
            textarea
            value={form.description}
            onChange={handleChange}
            rows="3"
          />

          <div className="form-group">
            <label>Chef de projet *</label>
            <select
              name="chef_projet"
              value={form.chef_projet}
              onChange={handleChange}
              required
              disabled={!isAdminOrManager && isCadre}
            >
              <option value="">Sélectionner un chef de projet</option>
              {cadres.map(c => (
                <option key={c.id} value={c.id}>{c.username} ({c.first_name} {c.last_name})</option>
              ))}
            </select>
            <small style={{ color: '#666' }}>Le chef de projet pourra gérer les heures et les intervenants</small>
          </div>

          <Input
            label="Estimation (heures) *"
            name="estimation_heures"
            type="number"
            step="0.5"
            value={form.estimation_heures}
            onChange={handleChange}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Date début *"
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
            />
          </div>

          {/* SECTION RENTABILITÉ FINANCIÈRE */}
          <div style={{ 
            marginTop: '1rem', 
            marginBottom: '1rem', 
            padding: '1rem', 
            backgroundColor: '#f0f9ff', 
            borderRadius: '8px',
            border: '1px solid #bae6fd'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#0369a1' }}>💰 Rentabilité financière</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <Input
                label="Coût du projet"
                name="cout_projet"
                type="number"
                step="1000"
                value={form.cout_projet || ''}
                onChange={handleChange}
                placeholder="Ex: 30000000"
              />
              <div className="form-group">
                <label>Devise</label>
                <select name="devise_cout" value={form.devise_cout} onChange={handleChange}>
                  <optgroup label="🌍 Afrique">
                    {devisesParRegion.afrique.map(d => (
                      <option key={d.code} value={d.code}>{d.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🇪🇺 Europe">
                    {devisesParRegion.europe.map(d => (
                      <option key={d.code} value={d.code}>{d.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🌎 Amérique">
                    {devisesParRegion.amerique.map(d => (
                      <option key={d.code} value={d.code}>{d.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🌏 Asie">
                    {devisesParRegion.asie.map(d => (
                      <option key={d.code} value={d.code}>{d.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🕌 Moyen-Orient">
                    {devisesParRegion.moyenOrient.map(d => (
                      <option key={d.code} value={d.code}>{d.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🌏 Océanie">
                    {devisesParRegion.oceanie.map(d => (
                      <option key={d.code} value={d.code}>{d.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <Input
                label="Bénéfice attendu"
                name="benefice_attendu"
                type="number"
                step="1000"
                value={form.benefice_attendu || ''}
                onChange={handleChange}
                placeholder="Ex: 6000000"
              />
              <div className="form-group">
                <label>Devise</label>
                <select name="devise_benefice" value={form.devise_benefice} onChange={handleChange}>
                  <optgroup label="🌍 Afrique">
                    {devisesParRegion.afrique.map(d => (
                      <option key={d.code} value={d.code}>{d.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🇪🇺 Europe">
                    {devisesParRegion.europe.map(d => (
                      <option key={d.code} value={d.code}>{d.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🌎 Amérique">
                    {devisesParRegion.amerique.map(d => (
                      <option key={d.code} value={d.code}>{d.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🌏 Asie">
                    {devisesParRegion.asie.map(d => (
                      <option key={d.code} value={d.code}>{d.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🕌 Moyen-Orient">
                    {devisesParRegion.moyenOrient.map(d => (
                      <option key={d.code} value={d.code}>{d.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🌏 Océanie">
                    {devisesParRegion.oceanie.map(d => (
                      <option key={d.code} value={d.code}>{d.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
            
            {form.cout_projet && form.benefice_attendu && (
              <div style={{ 
                marginTop: '0.5rem', 
                padding: '0.5rem', 
                backgroundColor: '#e0f2fe', 
                borderRadius: '4px',
                fontSize: '0.8rem'
              }}>
                <strong>Aperçu :</strong> Marge attendue = {(parseFloat(form.benefice_attendu) / parseFloat(form.cout_projet) * 100).toFixed(1)}%
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Statut</label>
            <select name="statut" value={form.statut} onChange={handleChange}>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
              <option value="suspendu">Suspendu</option>
            </select>
          </div>

          <div className="form-group">
            <label>Intervenants (techniciens)</label>
            <select
              multiple
              value={form.intervenants_ids}
              onChange={handleIntervenantsChange}
              style={{ height: '120px' }}
            >
              {techniciens.map(t => (
                <option key={t.id} value={t.id}>{t.username} ({t.first_name} {t.last_name})</option>
              ))}
            </select>
            <small style={{ color: '#666' }}>Maintenez Ctrl pour sélectionner plusieurs intervenants</small>
          </div>

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

export default ProjetForm;