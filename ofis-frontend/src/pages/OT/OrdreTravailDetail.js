import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaArrowLeft, FaEdit, FaPlay, FaStop } from 'react-icons/fa';
import { otService } from '../../services/otService';
import { authService } from '../../services/authService';
import './OT.css';
import SuiviOTSection from './SuiviOTSection';

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date.toLocaleString();
};

const OrdreTravailDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ot, setOt] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = authService.getCurrentUser();
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  useEffect(() => {
    chargerOT();
  }, [id]);

  const chargerOT = async () => {
    try {
      const data = await otService.getById(id);
      setOt(data);
    } catch (error) {
      console.error('Erreur chargement OT', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDemarrer = async () => {
    if (window.confirm('Démarrer cet ordre de travail ?')) {
      try {
        await otService.demarrer(id);
        chargerOT();
      } catch (error) {
        alert('Erreur au démarrage');
      }
    }
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
  if (!ot) return <div className="error">OT non trouvé</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Retour
        </Button>
        <h1>{ot.reference}</h1>
      </div>

      <Card>
        <div className="ordre-detail">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2>{ot.objet || ot.mission_title || 'Sans objet'}</h2>
            <div>
              {getStatutBadge(ot.statut)}
              {ot.statut === 'termine' && getValidationBadge(ot.statut_validation)}
            </div>
          </div>

          <div className="info-grid">
            <div className="info-item"><strong>Technicien :</strong> {ot.technicien_username}</div>
            {ot.client_rapport_name && <div className="info-item"><strong>Client :</strong> {ot.client_rapport_name}</div>}
            {ot.lieu && <div className="info-item"><strong>Lieu :</strong> {ot.lieu}</div>}
            {ot.duree_estimee && <div className="info-item"><strong>Durée estimée :</strong> {ot.duree_estimee} h</div>}
            {ot.bon_commande_numero && <div className="info-item"><strong>Bon de commande :</strong> {ot.bon_commande_numero}</div>}
            {ot.reference_bc_externe && <div className="info-item"><strong>Réf. BC externe :</strong> {ot.reference_bc_externe}</div>}
            {ot.reference_externe && <div className="info-item"><strong>Réf. SAGE :</strong> {ot.reference_externe}</div>}
            {ot.code_client && <div className="info-item"><strong>Code client :</strong> {ot.code_client}</div>}
            {ot.reference_devis && <div className="info-item"><strong>Réf. devis :</strong> {ot.reference_devis}</div>}
            {ot.mission_location && <div className="info-item"><strong>Lieu (mission) :</strong> {ot.mission_location}</div>}
            {formatDate(ot.date_debut) && <div className="info-item"><strong>Début :</strong> {formatDate(ot.date_debut)}</div>}
            {formatDate(ot.date_fin) && <div className="info-item"><strong>Fin :</strong> {formatDate(ot.date_fin)}</div>}
            {formatDate(ot.date_validation) && <div className="info-item"><strong>Validé le :</strong> {formatDate(ot.date_validation)}</div>}
            {ot.valide_par_username && <div className="info-item"><strong>Validé par :</strong> {ot.valide_par_username}</div>}
          </div>

          {ot.documents && ot.documents.length > 0 && (
            <div className="documents-section">
              <h3>Documents joints</h3>
              <div className="documents-list">
                {ot.documents.map(doc => (
                  <div key={doc.id} className="document-item">
                    <a href={doc.fichier_url} target="_blank" rel="noopener noreferrer">
                      {doc.nom} ({doc.type})
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section suivi quotidien des heures */}
          <SuiviOTSection 
            otId={ot.id} 
            dureeEstimee={ot.duree_estimee} 
            technicienId={ot.technicien} 
          />

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            {!isManager && ot.statut === 'planifie' && (
              <Button variant="primary" onClick={handleDemarrer}>
                <FaPlay /> Démarrer
              </Button>
            )}
            {!isManager && ot.statut === 'en_cours' && (
              <Link to={`/ordres-travail/${ot.id}/rapport`}>
                <Button variant="primary">
                  <FaStop /> Terminer
                </Button>
              </Link>
            )}
            {isManager && (
              <Link to={`/ordres-travail/modifier/${ot.id}`}>
                <Button variant="outline"><FaEdit /> Modifier</Button>
              </Link>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OrdreTravailDetail;