import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaArrowLeft, FaDownload } from 'react-icons/fa';
import { bonService } from '../../services/bonService';
import './BonDeCommande.css';

const BonQR = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    chargerQR();
  }, [id]);

  const chargerQR = async () => {
    try {
      const data = await bonService.getQR(id);
      setQrData(data.qr_code);
    } catch (err) {
      console.error('Erreur chargement QR:', err);
      setError('Impossible de générer le QR code');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrData;
    link.download = `bon-${id}-qr.png`;
    link.click();
  };

  if (loading) return <div>Chargement du QR code...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <Button variant="outline" onClick={() => navigate('/bons')}>
          <FaArrowLeft /> Retour à la liste
        </Button>
        <h1>QR Code du bon</h1>
      </div>

      <Card style={{ textAlign: 'center' }}>
        {qrData ? (
          <>
            <img
              src={qrData}
              alt="QR Code du bon de commande"
              style={{ maxWidth: '300px', margin: '2rem auto' }}
            />
            <div>
              <Button onClick={downloadQR} variant="primary">
                <FaDownload /> Télécharger
              </Button>
            </div>
          </>
        ) : (
          <p>Impossible de générer le QR code</p>
        )}
      </Card>
    </div>
  );
};

export default BonQR;