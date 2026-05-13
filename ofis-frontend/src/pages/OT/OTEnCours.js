import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaPlus, FaEye, FaPlay, FaSearch, FaFilter, FaTrash } from 'react-icons/fa';
import { otService } from '../../services/otService';
import { authService } from '../../services/authService';
import './OT.css';

const OTEnCours = () => {
  const [ots, setOts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ statut: '' });
  const [showFilters, setShowFilters] = useState(false);
  const user = authService.getCurrentUser();
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  useEffect(() => {
    chargerOT();
  }, [filters, search]);

  const chargerOT = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filters.statut) params.statut = filters.statut;
      
      const data = await otService.getAll(params);
      const enCours = Array.isArray(data)
        ? data.filter(ot => ot.statut === 'planifie' || ot.statut === 'en_cours')
        : [];
      setOts(enCours);
    } catch (error) {
      console.error('Erreur chargement OT', error);
      setOts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDemarrer = async (id) => {
    if (window.confirm('Démarrer cet OT ?')) {
      try {
        await otService.demarrer(id);
        chargerOT();
        alert('OT démarré avec succès');
      } catch (error) {
        alert('Erreur au démarrage');
      }
    }
  };

  const handleSupprimer = async (id, reference) => {
    if (window.confirm(`Supprimer définitivement l'OT ${reference} ?`)) {
      try {
        await otService.delete(id);
        chargerOT();
        alert(`OT ${reference} supprimé avec succès`);
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const getStatutBadge = (statut) => {
    const config = {
      planifie: { label: 'Planifié', color: '#f59e0b', bg: '#FEF3C7' },
      en_cours: { label: 'En cours', color: '#3b82f6', bg: '#DBEAFE' }
    };
    const c = config[statut] || { label: statut, color: '#666', bg: '#f0f0f0' };
    return (
      <span style={{ 
        background: c.bg, 
        color: c.color, 
        padding: '0.25rem 0.75rem', 
        borderRadius: '20px', 
        fontSize: '0.75rem', 
        fontWeight: 500 
      }}>
        {c.label}
      </span>
    );
  };

  const getAvancementBar = (heuresConsommees, estimationHeures) => {
    const hConsommees = parseFloat(heuresConsommees) || 0;
    const hEstimation = parseFloat(estimationHeures) || 0;
    
    if (!hEstimation || hEstimation === 0) {
      return <span style={{ fontSize: '0.75rem' }}>-</span>;
    }
    const pourcentage = Math.min(100, (hConsommees / hEstimation) * 100);
    return (
      <div style={{ minWidth: '100px' }}>
        <div style={{ background: '#e0e0e0', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
          <div style={{ 
            background: pourcentage >= 100 ? '#10b981' : '#3b82f6', 
            width: `${pourcentage}%`, 
            height: '6px' 
          }} />
        </div>
        <span style={{ fontSize: '0.7rem' }}>
          {Math.round(pourcentage)}% ({hConsommees}h/{hEstimation}h)
        </span>
      </div>
    );
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>OT en cours</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <FaSearch style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <input
              type="text"
              placeholder="Rechercher par référence, objet, client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '0.5rem 0.5rem 0.5rem 2rem', width: '280px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            style={{ 
              padding: '0.5rem 1rem', 
              background: showFilters ? '#1976D2' : '#f0f0f0', 
              color: showFilters ? 'white' : '#333',
              border: '1px solid #ccc', 
              borderRadius: '4px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem' 
            }}
          >
            <FaFilter /> Filtres
          </button>
          {filters.statut && (
            <button 
              onClick={() => setFilters({ statut: '' })} 
              style={{ 
                padding: '0.5rem 1rem', 
                background: '#fee2e2', 
                border: '1px solid #fecaca', 
                borderRadius: '4px', 
                cursor: 'pointer', 
                color: '#dc2626' 
              }}
            >
              Effacer
            </button>
          )}
          {isManager && (
            <Link to="/ordres-travail/nouveau">
              <Button variant="primary">
                <FaPlus /> Nouvel OT
              </Button>
            </Link>
          )}
        </div>
      </div>

      {showFilters && (
        <Card style={{ marginBottom: '1rem', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '0.75rem', marginRight: '0.5rem' }}>Statut :</label>
              <select 
                value={filters.statut} 
                onChange={(e) => setFilters({ ...filters, statut: e.target.value })} 
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', minWidth: '150px' }}
              >
                <option value="">Tous statuts</option>
                <option value="planifie">Planifié</option>
                <option value="en_cours">En cours</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {ots.length === 0 ? (
        <Card style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Aucun OT en cours.</p>
        </Card>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            background: 'white', 
            borderRadius: '8px', 
            overflow: 'hidden', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
          }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Référence</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Objet</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Client</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Techniciens</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Heures</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Avancement</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Statut</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ots.map(ot => {
                const heuresConsommees = parseFloat(ot.heures_consommees) || 0;
                const estimationHeures = parseFloat(ot.estimation_heures) || 0;
                const isTechnicien = ot.techniciens_ids?.includes(user?.id);
                const peutSupprimer = isManager;
                
                // Récupération du nom du client
                const clientName = ot.client_rapport_name || 
                                  ot.client_rapport?.company || 
                                  (ot.client_rapport ? `${ot.client_rapport.firstName || ''} ${ot.client_rapport.lastName || ''}` : '-');
                
                // Récupération des noms des techniciens
                const techniciensList = ot.techniciens_names?.join(', ') || 
                                       ot.techniciens?.map(t => t.username).join(', ') || 
                                       '-';
                
                return (
                  <tr 
                    key={ot.id} 
                    style={{ borderBottom: '1px solid #e0e0e0' }} 
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'} 
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <td style={{ padding: '0.75rem', fontWeight: 500 }}>{ot.reference}</td>
                    <td style={{ padding: '0.75rem' }}>
                      {ot.objet?.substring(0, 50)}{ot.objet?.length > 50 ? '...' : ''}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{clientName}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem' }}>{techniciensList}</td>
                    <td style={{ padding: '0.75rem' }}>
                      {heuresConsommees.toFixed(1)}/{estimationHeures.toFixed(0) || '-'}h
                    </td>
                    <td style={{ padding: '0.75rem', minWidth: '130px' }}>
                      {getAvancementBar(heuresConsommees, estimationHeures)}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{getStatutBadge(ot.statut)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <Link to={`/ordres-travail/${ot.id}`}>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1976D2', fontSize: '1rem' }} title="Voir les détails">
                            <FaEye />
                          </button>
                        </Link>
                        {!isManager && isTechnicien && ot.statut === 'planifie' && (
                          <button onClick={() => handleDemarrer(ot.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', fontSize: '1rem' }} title="Démarrer l'OT">
                            <FaPlay />
                          </button>
                        )}
                        {peutSupprimer && (
                          <button onClick={() => handleSupprimer(ot.id, ot.reference)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1rem' }} title="Supprimer l'OT">
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ 
        marginTop: '1rem', 
        display: 'flex', 
        gap: '1.5rem', 
        flexWrap: 'wrap', 
        fontSize: '0.7rem', 
        color: '#666',
        padding: '0.5rem',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <span>📊 <strong>Légende :</strong></span>
        <span><span style={{ background: '#FEF3C7', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>Planifié</span> = OT non démarré</span>
        <span><span style={{ background: '#DBEAFE', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>En cours</span> = OT en progression</span>
        <span>📈 <strong>Avancement :</strong> (heures consommées / estimation) en %</span>
      </div>
    </div>
  );
};

export default OTEnCours;