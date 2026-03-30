import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaArrowLeft, FaQrcode } from 'react-icons/fa';
import { bonService } from '../../services/bonService';
import './BonDeCommande.css';

const deviseSymbol = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  XAF: 'FCFA',
  XOF: 'FCFA',
  MAD: 'DH',
  DZD: 'DA',
  TND: 'DT',
};

const BonDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bon, setBon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    chargerBon();
  }, [id]);

  const chargerBon = async () => {
    try {
      const data = await bonService.getBon(id);
      console.log('Données reçues :', data);
      setBon(data);
    } catch (err) {
      console.error('Erreur chargement bon :', err);
      if (err.response) {
        setError(`Erreur ${err.response.status} : ${err.response.data?.detail || 'Erreur inconnue'}`);
      } else if (err.request) {
        setError('Aucune réponse du serveur');
      } else {
        setError('Erreur : ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!bon) return <div>Bon non trouvé</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <Button variant="outline" onClick={() => navigate('/bons')}>
          <FaArrowLeft /> Retour
        </Button>
        <h1>Bon de commande {bon.numero}</h1>
      </div>

      <Card>
        <div className="bon-detail">
          <p><strong>Client :</strong> {bon.client_name || bon.client}</p>
          <p><strong>Montant HT :</strong> {bon.montant_ht} {deviseSymbol[bon.devise] || bon.devise}</p>
          <p><strong>TVA :</strong> {bon.tva} %</p>
          <p><strong>Montant TTC :</strong> {bon.montant_ttc} {deviseSymbol[bon.devise] || bon.devise}</p>
          <p><strong>Devise :</strong> {bon.devise} {deviseSymbol[bon.devise] || ''}</p>
          <p><strong>Statut :</strong> 
            <span className={`statut-badge statut-${bon.statut}`}>
              {bon.statut === 'en_attente' ? 'En attente' :
               bon.statut === 'valide' ? 'Validé' :
               bon.statut === 'paye' ? 'Payé' : 'Annulé'}
            </span>
          </p>
          <p><strong>Date création :</strong> {new Date(bon.date_creation).toLocaleString()}</p>
          {bon.date_validation && <p><strong>Date validation :</strong> {new Date(bon.date_validation).toLocaleString()}</p>}
          {bon.date_paiement && <p><strong>Date paiement :</strong> {new Date(bon.date_paiement).toLocaleString()}</p>}
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <Link to={`/bons/qr/${bon.id}`}>
            <Button variant="primary">
              <FaQrcode /> Voir QR Code
            </Button>
          </Link>
          <Link to={`/bons/modifier/${bon.id}`}>
            <Button variant="outline">Modifier</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default BonDetail;