import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaEye, FaTrash, FaSearch } from 'react-icons/fa';
import { otService } from '../../services/otService';
import { authService } from '../../services/authService';
import './OT.css';

const OTClotures = () => {
  const [ots, setOts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const user = authService.getCurrentUser();
  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const currentUserId = user?.id;

  useEffect(() => {
    chargerOT();
  }, [search]);

  const chargerOT = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      
      const data = await otService.getAll(params);
      const clotures = Array.isArray(data)
        ? data.filter(ot => ot.statut === 'termine' && ot.statut_validation === 'valide')
        : [];
      setOts(clotures);
    } catch (error) {
      console.error('Erreur chargement OT', error);
      setOts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer définitivement cet OT ?')) {
      try {
        await otService.delete(id);
        chargerOT();
      } catch (error) {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const getAvancementBar = (heuresConsommees, estimationHeures) => {
    // Convertir en nombres
    const hConsommees = parseFloat(heuresConsommees) || 0;
    const hEstimation = parseFloat(estimationHeures) || 0;
    
    if (!hEstimation || hEstimation === 0) {
      return <span style={{ fontSize: '0.75rem' }}>-</span>;
    }
    const pourcentage = Math.min(100, (hConsommees / hEstimation) * 100);
    return (
      <div style={{ minWidth: '100px' }}>
        <div style={{ background: '#e0e0e0', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
          <div style={{ background: '#10b981', width: `${pourcentage}%`, height: '6px' }} />
        </div>
        <span style={{ fontSize: '0.7rem' }}>{Math.round(pourcentage)}% ({hConsommees}h/{hEstimation}h)</span>
      </div>
    );
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>OT clôturés</h1>
        <div style={{ position: 'relative' }}>
          <FaSearch style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '0.5rem 0.5rem 0.5rem 2rem', width: '250px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
      </div>

      {ots.length === 0 ? (
        <Card style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Aucun OT clôturé.</p>
        </Card>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Référence</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Objet</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Client</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Techniciens</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Heures</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Réalisés</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Validé le</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ots.map(ot => {
                const isOwner = !isManager && ot.techniciens_ids?.includes(currentUserId);
                const heuresConsommees = parseFloat(ot.heures_consommees) || 0;
                const estimationHeures = parseFloat(ot.estimation_heures) || 0;
                return (
                  <tr key={ot.id} style={{ borderBottom: '1px solid #e0e0e0' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                    <td style={{ padding: '0.75rem', fontWeight: 500 }}>{ot.reference}</td>
                    <td style={{ padding: '0.75rem' }}>{ot.objet?.substring(0, 40)}{ot.objet?.length > 40 ? '...' : ''}</td>
                    <td style={{ padding: '0.75rem' }}>{ot.client_rapport_name || '-'}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem' }}>{ot.techniciens_names?.join(', ') || '-'}</td>
                    <td style={{ padding: '0.75rem' }}>{heuresConsommees.toFixed(1)}/{estimationHeures.toFixed(0) || '-'}h</td>
                    <td style={{ padding: '0.75rem', minWidth: '120px' }}>{getAvancementBar(heuresConsommees, estimationHeures)}</td>
                    <td style={{ padding: '0.75rem' }}>{ot.date_validation ? new Date(ot.date_validation).toLocaleDateString() : '-'}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                        <Link to={`/ordres-travail/${ot.id}`}>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1976D2' }} title="Voir">
                            <FaEye />
                          </button>
                        </Link>
                        {(isManager || isOwner) && (
                          <button onClick={() => handleDelete(ot.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Supprimer">
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
    </div>
  );
};

export default OTClotures;
