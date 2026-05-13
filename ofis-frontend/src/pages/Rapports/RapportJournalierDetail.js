import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaArrowLeft } from 'react-icons/fa';
import api from '../../services/api';

const RapportJournalierDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rapport, setRapport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerRapport();
  }, [id]);

  const chargerRapport = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/rapports-journaliers/${id}/`);
      setRapport(data);
    } catch (error) {
      console.error('Erreur chargement rapport', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (!rapport) return <div>Rapport non trouvé</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Retour
        </Button>
        <h1>Rapport journalier du {new Date(rapport.date).toLocaleDateString()}</h1>
      </div>

      <Card>
        <p><strong>Technicien :</strong> {rapport.technicien_name}</p>
        {rapport.sous_service_name && (
          <p><strong>Sous-service :</strong> {rapport.sous_service_parent} - {rapport.sous_service_name}</p>
        )}
        <p><strong>Date :</strong> {new Date(rapport.date).toLocaleDateString()}</p>

        <h3>Détail des interventions</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Nature</th>
              <th>Description</th>
              <th>Durée</th>
              <th>RIT</th>
              <th>PV</th>
            </tr>
          </thead>
          <tbody>
            {rapport.lignes?.map((ligne, idx) => (
              <tr key={idx}>
                <td>{ligne.client_name}</td>
                <td>{ligne.nature_intervention}</td>
                <td>{ligne.description}</td>
                <td>{ligne.duree} h</td>
                <td>{ligne.rit_signe ? '✓' : '✗'}</td>
                <td>{ligne.pv_signe ? '✓' : '✗'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default RapportJournalierDetail;