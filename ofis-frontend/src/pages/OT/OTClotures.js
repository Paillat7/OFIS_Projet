import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaEye, FaTrash } from 'react-icons/fa';
import { otService } from '../../services/otService';
import { authService } from '../../services/authService';
import './OT.css';

const OTClotures = () => {
  const [ordres, setOrdres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const user = authService.getCurrentUser();
  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const currentUserId = user?.id;

  console.log('User :', user);
  console.log('currentUserId :', currentUserId);

  useEffect(() => {
    chargerOT();
  }, []);

  const chargerOT = async () => {
    setLoading(true);
    try {
      const data = await otService.getAll();
      const clotures = data.filter(ot => ot.statut_validation === 'valide');
      console.log('OT clôturés reçus :', clotures);
      setOrdres(clotures);
    } catch (error) {
      console.error('Erreur chargement OT', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet OT ?')) return;
    try {
      await otService.delete(id);
      chargerOT();
    } catch (error) {
      console.error(error);
      if (error.response?.status === 404) {
        chargerOT();
      } else {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const filteredOrdres = ordres.filter(ot =>
    ot.technicien_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ot.objet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ot.client_rapport_name && ot.client_rapport_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (ot.reference_bc_externe && ot.reference_bc_externe.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>OT clôturés</h1>
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '0.5rem', width: '300px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {filteredOrdres.length === 0 ? (
          <Card style={{ padding: '2rem', textAlign: 'center' }}>
            <p>Aucun OT clôturé.</p>
          </Card>
        ) : (
          filteredOrdres.map(ot => {
            console.log(`OT ${ot.id} : technicien_id=${ot.technicien_id}, currentUserId=${currentUserId}`);
            const isOwner = !isManager && Number(ot.technicien_id) === Number(currentUserId);
            return (
              <Card key={ot.id} className="ordre-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3>{ot.reference} - {ot.objet || ot.mission_title || 'Sans objet'}</h3>
                    <p><strong>Technicien :</strong> {ot.technicien_username}</p>
                    {ot.reference_bc_externe && <p><strong>Bon :</strong> {ot.reference_bc_externe}</p>}
                    <p><strong>Client :</strong> {ot.client_rapport_name || '-'}</p>
                    <p><strong>Lieu :</strong> {ot.lieu || ot.mission_location || 'Non précisé'}</p>
                    <p><strong>Validé le :</strong> {new Date(ot.date_validation).toLocaleString()}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/ordres-travail/${ot.id}`}>
                      <Button variant="outline" size="small">
                        <FaEye /> Voir
                      </Button>
                    </Link>
                    {(isManager || isOwner) && (
                      <Button variant="outline" size="small" onClick={() => handleDelete(ot.id)}>
                        <FaTrash />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OTClotures;