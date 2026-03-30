import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { rapportService } from '../../services/rapportService';
import { FaArrowLeft } from 'react-icons/fa';

const RapportJournalierDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rapport, setRapport] = useState(null);

  useEffect(() => {
    const fetchRapport = async () => {
      try {
        const data = await rapportService.getJournalier(id);
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
        <h2>Rapport journalier</h2>
        <p><strong>Date :</strong> {new Date(rapport.date).toLocaleDateString()}</p>
        <p><strong>Technicien :</strong> {rapport.technicien_name}</p>
        <p><strong>Service :</strong> {rapport.service || 'Non défini'}</p>   {/* Nouvelle ligne */}
        <p><strong>Client :</strong> {rapport.client_name}</p>
        <p><strong>Heure départ :</strong> {rapport.heure_depart}</p>
        <p><strong>Heure arrivée :</strong> {rapport.heure_arrivee}</p>
        <p><strong>Heure RDV :</strong> {rapport.heure_rdv}</p>
        <p><strong>Type intervention :</strong> {rapport.type_intervention}</p>
        <p><strong>RDV planifié :</strong> {rapport.rdv_planifie ? 'Oui' : 'Non'}</p>
        <p><strong>Description :</strong> {rapport.description}</p>
        <p><strong>RIT signé :</strong> {rapport.rit_signe ? 'Oui' : 'Non'}</p>
        <p><strong>PV signé :</strong> {rapport.pv_signe ? 'Oui' : 'Non'}</p>
        <p><strong>Conclusions :</strong> {rapport.conclusions}</p>
      </Card>
    </div>
  );
};

export default RapportJournalierDetail;