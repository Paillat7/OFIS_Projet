import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaPlus, FaPlay, FaStop, FaEye, FaEdit } from 'react-icons/fa';
import { otService } from '../../services/otService';
import { authService } from '../../services/authService';
import './OT.css';

const OrdresTravailList = () => {
  const [ordres, setOrdres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const user = authService.getCurrentUser();
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  useEffect(() => {
    chargerOrdres();
  }, [filter]);

  const chargerOrdres = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { statut: filter } : {};
      const data = await otService.getAll(params);
      setOrdres(data);
    } catch (error) {
      console.error('Erreur chargement OT', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDemarrer = async (id) => {
    if (window.confirm('Démarrer cet ordre de travail ?')) {
      try {
        await otService.demarrer(id);
        chargerOrdres();
      } catch (error) {
        alert('Erreur au démarrage');
      }
    }
  };

  const handleTerminer = (id) => {
    window.location.href = `/ordres-travail/${id}/rapport`;
  };

  const getStatutBadge = (statut) => {
    const config = {
      'planifie': { color: '#f59e0b', text: 'Planifié' },
      'en_cours': { color: '#10b981', text: 'En cours' },
      'termine': { color: '#6b7280', text: 'Terminé' },
      'annule': { color: '#ef4444', text: 'Annulé' }
    };
    const s = config[statut] || config.planifie;
    return (
      <span style={{
        backgroundColor: s.color + '20',
        color: s.color,
        padding: '4px 8px',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: 'bold'
      }}>
        {s.text}
      </span>
    );
  };

  const getValidationBadge = (statut) => {
    const config = {
      'en_attente': { color: '#f59e0b', text: 'À valider' },
      'valide': { color: '#10b981', text: 'Validé' },
      'rejete': { color: '#ef4444', text: 'Rejeté' }
    };
    const s = config[statut] || config.en_attente;
    return (
      <span style={{
        backgroundColor: s.color + '20',
        color: s.color,
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '0.7rem',
        fontWeight: 'bold',
        marginLeft: '0.5rem'
      }}>
        {s.text}
      </span>
    );
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

      <Card style={{ marginBottom: '2rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button 
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="small"
            onClick={() => setFilter('all')}
          >
            Tous
          </Button>
          <Button 
            variant={filter === 'planifie' ? 'primary' : 'outline'}
            size="small"
            onClick={() => setFilter('planifie')}
          >
            Planifiés
          </Button>
          <Button 
            variant={filter === 'en_cours' ? 'primary' : 'outline'}
            size="small"
            onClick={() => setFilter('en_cours')}
          >
            En cours
          </Button>
          <Button 
            variant={filter === 'termine' ? 'primary' : 'outline'}
            size="small"
            onClick={() => setFilter('termine')}
          >
            Terminés
          </Button>
        </div>
      </Card>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {ordres.length === 0 ? (
          <Card style={{ padding: '2rem', textAlign: 'center' }}>
            <p>Aucun ordre de travail trouvé.</p>
          </Card>
        ) : (
          ordres.map(ot => (
            <Card key={ot.id} className="ordre-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0 }}>{ot.reference} - {ot.mission_title}</h3>
                    {getStatutBadge(ot.statut)}
                    {ot.statut === 'termine' && getValidationBadge(ot.statut_validation)}
                  </div>
                  <p><strong>Technicien :</strong> {ot.technicien_username}</p>
                  {ot.bon_commande_numero && <p><strong>Bon :</strong> {ot.bon_commande_numero}</p>}
                  {ot.reference_externe && <p><strong>Réf. SAGE :</strong> {ot.reference_externe}</p>}
                  {ot.date_debut && <p><strong>Début :</strong> {new Date(ot.date_debut).toLocaleString()}</p>}
                  {ot.date_fin && <p><strong>Fin :</strong> {new Date(ot.date_fin).toLocaleString()}</p>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/ordres-travail/${ot.id}`}>
                    <Button size="small" variant="outline" title="Voir détails">
                      <FaEye />
                    </Button>
                  </Link>
                  {isManager && ot.statut !== 'annule' && (
                    <Link to={`/ordres-travail/modifier/${ot.id}`}>
                      <Button size="small" variant="outline" title="Modifier">
                        <FaEdit />
                      </Button>
                    </Link>
                  )}
                  {!isManager && ot.statut === 'planifie' && (
                    <Button size="small" variant="primary" onClick={() => handleDemarrer(ot.id)}>
                      <FaPlay /> Démarrer
                    </Button>
                  )}
                  {!isManager && ot.statut === 'en_cours' && (
                    <Link to={`/ordres-travail/${ot.id}/rapport`}>
                      <Button size="small" variant="primary">
                        <FaStop /> Rapport
                      </Button>
                    </Link>
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

export default OrdresTravailList;