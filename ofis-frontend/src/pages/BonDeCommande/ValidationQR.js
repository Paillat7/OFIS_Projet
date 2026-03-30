import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { bonService } from '../../services/bonService';

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

const ValidationQR = () => {
  const { code } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (code) {
      validerBon();
    }
  }, [code]);

  const validerBon = async () => {
    try {
      const data = await bonService.validerParQR(code);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Erreur de validation');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Validation en cours...</div>;

  return (
    <div className="dashboard-page" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <Card>
        {error ? (
          <>
            <h2 style={{ color: '#ef4444' }}>Erreur</h2>
            <p>{error}</p>
          </>
        ) : result ? (
          <>
            <h2 style={{ color: '#10b981' }}>Bon validé avec succès !</h2>
            <p><strong>Numéro :</strong> {result.bon.numero}</p>
            <p><strong>Client :</strong> {result.bon.client_name}</p>
            <p><strong>Montant :</strong> {result.bon.montant_ttc} {deviseSymbol[result.bon.devise] || result.bon.devise}</p>
            <Link to={`/bons/${result.bon.id}`}>
              <Button variant="primary">Voir le bon</Button>
            </Link>
          </>
        ) : (
          <p>Aucune donnée</p>
        )}
      </Card>
    </div>
  );
};

export default ValidationQR;