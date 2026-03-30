import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import projetService from '../../services/projetService';
import { FaArrowLeft } from 'react-icons/fa';

const RapportProjetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rapport, setRapport] = useState(null);

  useEffect(() => {
    const fetchRapport = async () => {
      try {
        const data = await projetService.getById(id);
        setRapport(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchRapport();
  }, [id]);

  if (!rapport) return <div>Chargement...</div>;

  return (
    <div className="dashboard-page">
      <Button variant="outline" onClick={() => navigate(-1)}>
        <FaArrowLeft /> Retour
      </Button>
      <Card>
        <h2>Rapport projet</h2>
        <p><strong>Période :</strong> {new Date(rapport.date_debut).toLocaleDateString()} - {new Date(rapport.date_fin).toLocaleDateString()}</p>
        <p><strong>Cadre :</strong> {rapport.cadre_name}</p>
        <p><strong>Service :</strong> {rapport.service}</p>
        <p><strong>Total heures :</strong> {rapport.total_heures} h</p>
        {rapport.observations && <p><strong>Observations :</strong> {rapport.observations}</p>}

        <h3>Détail des interventions</h3>
        {rapport.lignes?.length === 0 ? (
          <p>Aucune intervention.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Technicien</th>
                <th>Client</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Durée (h)</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {rapport.lignes?.map(l => (
                <tr key={l.id}>
                  <td>{new Date(l.date_intervention).toLocaleDateString()}</td>
                  <td>{l.technicien_name}</td>
                  <td>{l.client_name}</td>
                  <td>{l.heure_debut}</td>
                  <td>{l.heure_fin}</td>
                  <td>{l.duree}</td>
                  <td>{l.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default RapportProjetDetail;