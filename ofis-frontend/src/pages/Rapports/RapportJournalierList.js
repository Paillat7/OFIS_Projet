import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaEye, FaEdit, FaPlus, FaSearch, FaTimes } from 'react-icons/fa';
import { rapportService } from '../../services/rapportService';
import { authService } from '../../services/authService';

const RapportJournalierList = () => {
  const [rapports, setRapports] = useState([]);
  const [filteredRapports, setFilteredRapports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchDate, setSearchDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const user = authService.getCurrentUser();
  const isTechnicien = user?.role === 'technicien';

  // Récupérer le paramètre date depuis l'URL (pour l'histogramme cliquable)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dateParam = params.get('date');
    if (dateParam) {
      setSearchDate(dateParam);
    }
  }, [location]);

  // Charger les rapports (une seule fois)
  useEffect(() => {
    chargerRapports();
  }, []);

  // Appliquer les filtres à chaque modification des critères
  useEffect(() => {
    let result = [...rapports];
    // Filtre par date
    if (searchDate) {
      result = result.filter(r => r.date === searchDate);
    }
    // Filtre par recherche (technicien ou service)
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(r => 
        (r.technicien_name && r.technicien_name.toLowerCase().includes(term)) ||
        (r.service && r.service.toLowerCase().includes(term))
      );
    }
    setFilteredRapports(result);
  }, [rapports, searchDate, searchTerm]);

  const chargerRapports = async () => {
    setLoading(true);
    try {
      const data = await rapportService.getJournaliers();
      setRapports(data);
    } catch (error) {
      console.error('Erreur chargement rapports', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Le filtre est déjà appliqué via useEffect, rien de plus à faire
  };

  const resetFilters = () => {
    setSearchDate('');
    setSearchTerm('');
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Rapports journaliers</h1>
        {isTechnicien && (
          <Link to="/rapports/journalier/nouveau">
            <Button variant="primary"><FaPlus /> Nouveau rapport</Button>
          </Link>
        )}
      </div>

      {/* Barre de recherche et filtres */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Filtrer par date</label>
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Rechercher (technicien / service)</label>
            <input
              type="text"
              placeholder="Ex: Angel, OSN, OBT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '0.5rem', width: '250px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <Button type="submit" variant="outline"><FaSearch /> Filtrer</Button>
          {(searchDate || searchTerm) && (
            <Button variant="outline" onClick={resetFilters}>
              <FaTimes /> Réinitialiser
            </Button>
          )}
        </form>
      </div>

      {/* Tableau des rapports */}
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Technicien</th>
              <th>Service</th>
              <th>Client</th>
              <th>RIT</th>
              <th>PV</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRapports.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>Aucun rapport correspondant.</td>
              </tr>
            ) : (
              filteredRapports.map(rapport => (
                <tr key={rapport.id}>
                  <td>{new Date(rapport.date).toLocaleDateString()}</td>
                  <td>{rapport.technicien_name}</td>
                  <td>{rapport.service}</td>
                  <td>{rapport.client_name}</td>
                  <td style={{ textAlign: 'center' }}>{rapport.rit_signe ? '☑' : '☐'}</td>
                  <td style={{ textAlign: 'center' }}>{rapport.pv_signe ? '☑' : '☐'}</td>
                  <td>
                    <Link to={`/rapports/journalier/${rapport.id}`} style={{ marginRight: '0.5rem' }}>
                      <Button variant="outline" size="small"><FaEye /></Button>
                    </Link>
                    {(isTechnicien && rapport.technicien === user?.id) && (
                      <Link to={`/rapports/journalier/modifier/${rapport.id}`}>
                        <Button variant="outline" size="small"><FaEdit /></Button>
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RapportJournalierList;