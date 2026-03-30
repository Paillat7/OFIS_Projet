// OrdreTravailRapport.js minimal
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { otService } from '../../services/otService';

const OrdreTravailRapport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Envoie un objet vide – les champs optionnels seront ignorés
      await otService.terminer(id, {});
      navigate(`/ordres-travail/${id}`);
    } catch (error) {
      alert('Erreur : ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Terminer l'OT</h1>
      </div>
      <Card>
        <p>Confirmez‑vous que l’intervention est terminée ?</p>
        <form onSubmit={handleSubmit}>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Envoi...' : 'Terminer'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Annuler
          </Button>
        </form>
      </Card>
    </div>
  );
};
export default OrdreTravailRapport;