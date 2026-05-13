import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaEye, FaTrash, FaPlus } from 'react-icons/fa';
import api from '../../services/api';
import { authService } from '../../services/authService';

const RapportJournalierList = () => {
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState('tous');
  const [filters, setFilters] = useState({ date_debut: '', date_fin: '' });
  const user = authService.getCurrentUser();
  const isTechnicien = user?.role === 'technicien';
  const isStaff = user?.role === 'manager' || user?.role === 'admin';
  const isCadre = user?.role === 'cadre';

  useEffect(() => {
    appliquerPeriode();
  }, [periode]);

  useEffect(() => {
    if (periode === 'tous') {
      chargerRapports();
    }
  }, [filters]);

  const appliquerPeriode = () => {
    const aujourdhui = new Date();
    let debut = '';
    let fin = '';

    switch (periode) {
      case 'aujourdhui':
        debut = aujourdhui.toISOString().split('T')[0];
        fin = aujourdhui.toISOString().split('T')[0];
        break;
      case 'semaine':
        const semaineDebut = new Date(aujourdhui);
        semaineDebut.setDate(aujourdhui.getDate() - 7);
        debut = semaineDebut.toISOString().split('T')[0];
        fin = aujourdhui.toISOString().split('T')[0];
        break;
      case 'mois':
        const moisDebut = new Date(aujourdhui);
        moisDebut.setMonth(aujourdhui.getMonth() - 1);
        debut = moisDebut.toISOString().split('T')[0];
        fin = aujourdhui.toISOString().split('T')[0];
        break;
      default:
        chargerRapports();
        return;
    }

    setFilters({ date_debut: debut, date_fin: fin });
    chargerRapportsAvecDates(debut, fin);
  };

  const chargerRapportsAvecDates = async (debut, fin) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('ofis_token');
      const queryParams = new URLSearchParams();
      if (debut) queryParams.append('date_debut', debut);
      if (fin) queryParams.append('date_fin', fin);
      
      const url = `http://localhost:8000/api/rapports-journaliers/${queryParams.toString() ? `?${queryParams}` : ''}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setRapports(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur:', error);
      setRapports([]);
    } finally {
      setLoading(false);
    }
  };

  const chargerRapports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('ofis_token');
      const queryParams = new URLSearchParams();
      if (filters.date_debut) queryParams.append('date_debut', filters.date_debut);
      if (filters.date_fin) queryParams.append('date_fin', filters.date_fin);
      
      const url = `http://localhost:8000/api/rapports-journaliers/${queryParams.toString() ? `?${queryParams}` : ''}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setRapports(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement rapports', error);
      setRapports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce rapport ?')) {
      try {
        await api.delete(`/rapports-journaliers/${id}/`);
        chargerRapports();
      } catch (error) {
        alert('Erreur suppression');
      }
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ date_debut: '', date_fin: '' });
    setPeriode('tous');
    chargerRapports();
  };

  const totalHeures = (lignes) => {
    if (!lignes || lignes.length === 0) return '0.00';
    const total = lignes.reduce((sum, l) => {
      const duree = parseFloat(l.duree);
      return sum + (isNaN(duree) ? 0 : duree);
    }, 0);
    return total.toFixed(2);
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1>Rapports journaliers</h1>
        {isTechnicien && (
          <Link to="/rapports/journalier/nouveau">
            <Button variant="primary"><FaPlus /> Nouveau rapport</Button>
          </Link>
        )}
      </div>

      {/* Filtres */}
      <div style={{
        background: 'white',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem',
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 500 }}>Période</label>
          <select
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="tous">Tous les rapports</option>
            <option value="aujourdhui">Aujourd'hui</option>
            <option value="semaine">7 derniers jours</option>
            <option value="mois">30 derniers jours</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 500 }}>Date début</label>
          <input
            type="date"
            name="date_debut"
            value={filters.date_debut}
            onChange={handleFilterChange}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 500 }}>Date fin</label>
          <input
            type="date"
            name="date_fin"
            value={filters.date_fin}
            onChange={handleFilterChange}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div>
          <button onClick={clearFilters} style={{
            padding: '0.5rem 1rem',
            background: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            height: '38px'
          }}>
            Effacer
          </button>
        </div>
      </div>

      {/* Liste des rapports */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {rapports.length === 0 ? (
          <Card><p>Aucun rapport journalier.</p></Card>
        ) : (
          rapports.map(rapport => (
            <Card key={rapport.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3>{rapport.technicien_name} - {new Date(rapport.date).toLocaleDateString()}</h3>
                  {rapport.sous_service_name && (
                    <p><strong>Sous-service :</strong> {rapport.sous_service_parent} - {rapport.sous_service_name}</p>
                  )}
                  <p><strong>Nombre d'interventions :</strong> {rapport.lignes?.length || 0}</p>
                  <p><strong>Heures totales :</strong> {totalHeures(rapport.lignes)} h</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/rapports/journalier/${rapport.id}`}>
                    <Button variant="outline" size="small"><FaEye /> Voir</Button>
                  </Link>
                  {(isStaff || (isCadre && rapport.technicien_id === user?.id) || (isTechnicien && rapport.technicien_id === user?.id)) && (
                    <Button variant="danger" size="small" onClick={() => handleDelete(rapport.id)}>
                      <FaTrash />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default RapportJournalierList;


