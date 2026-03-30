import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaArrowLeft, FaEdit } from 'react-icons/fa';
import { rapportService } from '../../services/rapportService';
import { authService } from '../../services/authService';
import './Rapports.css';
import { Link } from 'react-router-dom';

const RapportHebdomadaire = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rapport, setRapport] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = authService.getCurrentUser();
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  useEffect(() => {
    chargerRapport();
  }, [id]);

  const chargerRapport = async () => {
    try {
      const data = await rapportService.getHebdomadaire(id);
      setRapport(data);
    } catch (error) {
      console.error('Erreur chargement rapport', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (!rapport) return <div>Rapport non trouvé</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Retour
        </Button>
        <h1>Rapport hebdomadaire</h1>
      </div>

      <Card>
        <div className="rapport-detail">
          <p><strong>Période :</strong> {new Date(rapport.date_debut).toLocaleDateString()} - {new Date(rapport.date_fin).toLocaleDateString()}</p>
          <p><strong>Cadre / Technicien :</strong> {rapport.cadre_name || rapport.technicien_name}</p>
          {rapport.planning && (
            <div>
              <h3>Planning prévisionnel</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{rapport.planning}</p>
            </div>
          )}
          <h3>Activités réalisées</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{rapport.activites}</p>
          <h3>Objectifs atteints</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{rapport.objectifs_atteints}</p>
          <h3>Difficultés rencontrées</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{rapport.difficultes}</p>
          <h3>Propositions</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{rapport.propositions}</p>
        </div>

        <div style={{ marginTop: '2rem' }}>
          {(isManager || rapport.cadre === user?.id) && (
            <Link to={`/rapports/hebdomadaire/modifier/${rapport.id}`}>
              <Button variant="primary"><FaEdit /> Modifier</Button>
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
};

export default RapportHebdomadaire;