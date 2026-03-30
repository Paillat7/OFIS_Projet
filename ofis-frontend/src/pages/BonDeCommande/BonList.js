import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaPlus, FaQrcode, FaEye, FaTrash } from 'react-icons/fa';
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

const BonList = () => {
  const [bons, setBons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerBons();
  }, []);

  const chargerBons = async () => {
    try {
      const data = await bonService.getBons();
      setBons(data);
    } catch (error) {
      console.error('Erreur chargement bons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce bon de commande ?')) return;
    try {
      await bonService.deleteBon(id);
      setBons(bons.filter(b => b.id !== id));
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const getOtStatutLabel = (statut) => {
    const map = {
      'planifie': 'Planifié',
      'en_cours': 'En cours',
      'termine': 'Clôturé',
      'annule': 'Annulé'
    };
    return map[statut] || '-';
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Bons de commande</h1>
        <Link to="/bons/nouveau">
          <Button variant="primary">
            <FaPlus /> Nouveau bon
          </Button>
        </Link>
      </div>

      <Card>
        <table className="table">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Client</th>
              <th>Technicien</th>
              <th>Avancement OT</th>
              <th>Montant TTC</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bons.map(bon => (
              <tr key={bon.id}>
                <td>{bon.numero}</td>
                <td>{bon.client_name || bon.client}</td>
                <td>{bon.technicien || '-'}</td>
                <td>
                  {bon.ot_statut ? (
                    <span className={`ot-statut ot-statut-${bon.ot_statut}`}>
                      {getOtStatutLabel(bon.ot_statut)}
                    </span>
                  ) : '-'}
                </td>
                <td>{bon.montant_ttc} {deviseSymbol[bon.devise] || bon.devise}</td>
                <td>
                  <span className={`statut-badge statut-${bon.statut}`}>
                    {bon.statut === 'en_attente' ? 'En attente' :
                     bon.statut === 'valide' ? 'Validé' :
                     bon.statut === 'paye' ? 'Payé' : 'Annulé'}
                  </span>
                </td>
                <td>{new Date(bon.date_creation).toLocaleDateString()}</td>
                <td>
                  <Link to={`/bons/${bon.id}`}>
                    <Button size="small" variant="outline" title="Voir">
                      <FaEye />
                    </Button>
                  </Link>
                  <Link to={`/bons/qr/${bon.id}`}>
                    <Button size="small" variant="outline" title="QR Code">
                      <FaQrcode />
                    </Button>
                  </Link>
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => handleDelete(bon.id)}
                    title="Supprimer"
                  >
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default BonList;