import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaEye, FaCheck, FaTimes } from 'react-icons/fa';
import { bonService } from '../../services/bonService';
import './Assistante.css';

const AssistanteBons = () => {
  const [bons, setBons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerBons();
  }, []);

  const chargerBons = async () => {
    try {
      const data = await bonService.getBons({ statut: 'en_attente' });
      setBons(data);
    } catch (error) {
      console.error('Erreur chargement bons', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValider = async (id) => {
    if (!window.confirm('Valider ce bon de commande ?')) return;
    try {
      await bonService.validerBon(id);
      chargerBons();
    } catch (error) {
      alert('Erreur lors de la validation');
    }
  };

  const handleRejeter = async (id) => {
    if (!window.confirm('Rejeter ce bon de commande ?')) return;
    try {
      await bonService.rejeterBon(id);
      chargerBons();
    } catch (error) {
      alert('Erreur lors du rejet');
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="assistante-page">
      <div className="page-header">
        <h1>Bons de commande en attente</h1>
      </div>

      <Card>
        {bons.length === 0 ? (
          <p>Aucun bon de commande en attente.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Montant</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bons.map(b => (
                <tr key={b.id}>
                  <td>{b.numero}</td>
                  <td>{b.client_name}</td>
                  <td>{b.montant_ttc} {b.devise}</td>
                  <td>{new Date(b.date_creation).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/bons/${b.id}`}>
                      <Button size="small" variant="outline"><FaEye /></Button>
                    </Link>
                    <Button size="small" variant="outline" onClick={() => handleValider(b.id)} title="Valider"><FaCheck /></Button>
                    <Button size="small" variant="outline" onClick={() => handleRejeter(b.id)} title="Rejeter"><FaTimes /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default AssistanteBons;