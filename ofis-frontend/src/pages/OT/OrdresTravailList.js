import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaPlus, FaEye, FaPlay, FaSearch, FaFilter } from 'react-icons/fa';
import { otService } from '../../services/otService';
import { authService } from '../../services/authService';
import './OT.css';

const OrdresTravailList = () => {
  const [ots, setOts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ statut: '', validation: '' });
  const [showFilters, setShowFilters] = useState(false);
  const user = authService.getCurrentUser();
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const chargerOts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filters.statut) params.statut = filters.statut;
      if (filters.validation) params.validation = filters.validation;
      const data = await otService.getAll(params);
      if (isMounted.current) {
        setOts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      if (isMounted.current) {
        console.error('Erreur chargement OT', error);
        setOts([]);
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    chargerOts();
  }, [filters, search]);

  const handleDemarrer = async (id) => {
    if (window.confirm('Démarrer cet OT ?')) {
      try {
        await otService.demarrer(id);
        chargerOts();
      } catch (error) {
        alert('Erreur au démarrage');
      }
    }
  };

  const getStatutBadge = (statut) => {
    const config = {
      planifie: { label: 'Planifié', color: '#f59e0b', bg: '#FEF3C7' },
      en_cours: { label: 'En cours', color: '#3b82f6', bg: '#DBEAFE' },
      termine: { label: 'Terminé', color: '#10b981', bg: '#D1FAE5' }
    };
    const c = config[statut] || { label: statut, color: '#666', bg: '#f0f0f0' };
    return <span style={{ background: c.bg, color: c.color, padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 500 }}>{c.label}</span>;
  };

  const getValidationBadge = (validation) => {
    const config = {
      en_attente: { label: 'En attente', color: '#f59e0b', bg: '#FEF3C7' },
      valide: { label: 'Validé', color: '#10b981', bg: '#D1FAE5' },
      rejete: { label: 'Rejeté', color: '#ef4444', bg: '#FEE2E2' }
    };
    const c = config[validation] || { label: validation, color: '#666', bg: '#f0f0f0' };
    return <span style={{ background: c.bg, color: c.color, padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem', marginLeft: '0.5rem' }}>{c.label}</span>;
  };

  const getAvancementBar = (heuresConsommees, estimationHeures) => {
    if (!estimationHeures || estimationHeures === 0) {
      return <span style={{ fontSize: '0.75rem' }}>-</span>;
    }
    const pourcentage = Math.min(100, (heuresConsommees / estimationHeures) * 100);
    return (
      <div style={{ minWidth: '100px' }}>
        <div style={{ background: '#e0e0e0', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
          <div style={{ background: pourcentage >= 100 ? '#10b981' : '#3b82f6', width: `${pourcentage}%`, height: '6px' }} />
        </div>
        <span style={{ fontSize: '0.7rem' }}>{Math.round(pourcentage)}% ({heuresConsommees}h/{estimationHeures}h)</span>
      </div>
    );
  };

  const getLigneCouleur = (ot) => {
    if (!ot) return '#ffffff';
    if (ot.statut === 'termine') return '#e8f5e9';
    const estEnRetardDelai = ot.est_en_retard || false;
    const heuresConsommees = parseFloat(ot.heures_consommees) || 0;
    const heuresEstimees = parseFloat(ot.estimation_heures) || 0;
    const ecartHeures = heuresConsommees - heuresEstimees;
    const seuilHeures = 1.0;
    const estEnRetardHeures = ecartHeures > seuilHeures;
    if (estEnRetardDelai || estEnRetardHeures) return '#fee2e2';
    if (ot.statut === 'en_cours') return '#fff3e0';
    return '#e8f5e9';
  };

  const getStatutVisuel = (ot) => {
    if (!ot) return { label: '-', couleur: '#6b7280' };
    if (ot.statut === 'termine') return { label: '✅ Terminé', couleur: '#4caf50' };
    const estEnRetardDelai = ot.est_en_retard || false;
    const heuresConsommees = parseFloat(ot.heures_consommees) || 0;
    const heuresEstimees = parseFloat(ot.estimation_heures) || 0;
    const ecartHeures = heuresConsommees - heuresEstimees;
    const seuilHeures = 1.0;
    const estEnRetardHeures = ecartHeures > seuilHeures;
    if (estEnRetardDelai && estEnRetardHeures) return { label: '🔴 Retard (délai + heures)', couleur: '#ef4444' };
    if (estEnRetardDelai) return { label: '🔴 Retard (délai)', couleur: '#ef4444' };
    if (estEnRetardHeures) return { label: '🔴 Dépassement d\'heures', couleur: '#ef4444' };
    if (ot.statut === 'en_cours') return { label: '🟠 En cours', couleur: '#f59e0b' };
    return { label: '🟢 Dans les temps', couleur: '#4caf50' };
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Ordres de travail</h1>
        {isManager && (
          <Link to="/ordres-travail/nouveau">
            <Button variant="primary"><FaPlus /> Nouvel OT</Button>
          </Link>
        )}
      </div>

      <Card style={{ marginBottom: '1rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 2, position: 'relative' }}>
            <FaSearch style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} style={{ padding: '0.5rem 1rem', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaFilter /> Filtres
          </button>
          {(filters.statut || filters.validation) && (
            <button onClick={() => setFilters({ statut: '', validation: '' })} style={{ padding: '0.5rem 1rem', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', color: '#dc2626' }}>
              Effacer
            </button>
          )}
        </div>

        {showFilters && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
            <select value={filters.statut} onChange={(e) => setFilters({ ...filters, statut: e.target.value })} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value="">Tous statuts</option>
              <option value="planifie">Planifié</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
            </select>
            <select value={filters.validation} onChange={(e) => setFilters({ ...filters, validation: e.target.value })} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value="">Toutes validations</option>
              <option value="en_attente">En attente</option>
              <option value="valide">Validé</option>
              <option value="rejete">Rejeté</option>
            </select>
          </div>
        )}
      </Card>

      {ots.length === 0 ? (
        <Card style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Aucun ordre de travail trouvé.</p>
        </Card>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Statut</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Référence</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Objet</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Client</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Techniciens</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>TPR (prévu)</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>TER (réel)</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Écart</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Avancement</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ots.map(ot => {
                const bgColor = getLigneCouleur(ot);
                const statutVisuel = getStatutVisuel(ot);
                const heuresConsommees = parseFloat(ot.heures_consommees) || 0;
                const estimationHeures = parseFloat(ot.estimation_heures) || 0;
                const ecartHeures = heuresConsommees - estimationHeures;
                const ecartColor = ecartHeures > 1 ? '#ef4444' : ecartHeures < -1 ? '#10b981' : '#f59e0b';
                const ecartLabel = ecartHeures > 1 ? '+' : '';
                return (
                  <tr
                    key={ot.id}
                    style={{ borderBottom: '1px solid #e0e0e0', backgroundColor: bgColor }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.background = bgColor}
                  >
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ color: statutVisuel.couleur, fontWeight: 'bold', fontSize: '0.85rem' }}>
                        {statutVisuel.label}
                      </span>
                      {getValidationBadge(ot.statut_validation)}
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 500 }}>{ot.reference}</td>
                    <td style={{ padding: '0.75rem' }}>{ot.objet?.substring(0, 40)}{ot.objet?.length > 40 ? '...' : ''}</td>
                    <td style={{ padding: '0.75rem' }}>{ot.client_rapport_name || '-'}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem' }}>{ot.techniciens_names?.join(', ') || '-'}</td>
                    <td style={{ padding: '0.75rem' }}>{estimationHeures.toFixed(0) || '-'}h</td>
                    <td style={{ padding: '0.75rem' }}>{heuresConsommees.toFixed(1)}h</td>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold', color: ecartColor }}>
                      {ecartLabel}{ecartHeures.toFixed(1)}h
                      {ecartHeures > 1 && ' 🔴'}
                      {ecartHeures < -1 && ' ✅'}
                    </td>
                    <td style={{ padding: '0.75rem', minWidth: '120px' }}>{getAvancementBar(heuresConsommees, estimationHeures)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                        <Link to={`/ordres-travail/${ot.id}`}>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1976D2' }} title="Voir">
                            <FaEye />
                          </button>
                        </Link>
                        {ot.statut === 'planifie' && (
                          <button onClick={() => handleDemarrer(ot.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981' }} title="Démarrer">
                            <FaPlay />
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

      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.7rem', color: '#666' }}>
        <span>📋 Statuts: <span style={{ background: '#FEF3C7', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>Planifié</span> <span style={{ background: '#DBEAFE', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>En cours</span> <span style={{ background: '#D1FAE5', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>Terminé</span></span>
        <span>✅ Validation: <span style={{ background: '#FEF3C7', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>En attente</span> <span style={{ background: '#D1FAE5', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>Validé</span> <span style={{ background: '#FEE2E2', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>Rejeté</span></span>
        <span>📊 <strong>Légende :</strong></span>
        <span><span style={{ background: '#e8f5e9', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>🟢 Vert</span> = Dans les temps</span>
        <span><span style={{ background: '#fff3e0', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>🟠 Orange</span> = En cours (OK)</span>
        <span><span style={{ background: '#fee2e2', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>🔴 Rouge</span> = Retard</span>
        <span>📈 <strong>TPR</strong> = Temps Prévisionnel de Réalisation</span>
        <span>📈 <strong>TER</strong> = Temps Effectif de Réalisation</span>
        <span>📈 <strong>Écart</strong> = TER - TPR</span>
      </div>
    </div>
  );
};

export default OrdresTravailList;