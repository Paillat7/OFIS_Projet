import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaEye, FaPlay, FaPlus } from 'react-icons/fa';
import { otService } from '../../services/otService';
import { authService } from '../../services/authService';
import './OT.css';

const OTEnCours = () => {
  const [ordres, setOrdres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const user = authService.getCurrentUser();
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  useEffect(() => {
    chargerOT();
  }, []);

  const chargerOT = async () => {
    setLoading(true);
    try {
      const data = await otService.getAll();
      const enCours = data.filter(ot => ot.statut === 'planifie' || ot.statut === 'en_cours');
      setOrdres(enCours);
    } catch (error) {
      console.error('Erreur chargement OT', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDemarrer = async (id) => {
    if (window.confirm('Démarrer cet OT ?')) {
      try {
        await otService.demarrer(id);
        chargerOT();
      } catch (error) {
        alert('Erreur au démarrage');
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
        <h1>OT en cours</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.5rem', width: '300px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          {isManager && (
            <Link to="/ordres-travail/nouveau">
              <Button variant="primary"><FaPlus /> Nouvel OT</Button>
            </Link>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {filteredOrdres.length === 0 ? (
          <Card style={{ padding: '2rem', textAlign: 'center' }}>
            <p>Aucun OT en cours.</p>
          </Card>
        ) : (
          filteredOrdres.map(ot => (
            <Card key={ot.id} className="ordre-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3>{ot.reference} - {ot.objet || ot.mission_title || 'Sans objet'}</h3>
                  <p><strong>Technicien :</strong> {ot.technicien_username}</p>
                  {ot.reference_bc_externe && <p><strong>Bon :</strong> {ot.reference_bc_externe}</p>}
                  <p><strong>Client :</strong> {ot.client_rapport_name || '-'}</p>
                  <p><strong>Lieu :</strong> {ot.lieu || ot.mission_location || 'Non précisé'}</p>
                  <p><strong>Statut :</strong> {ot.statut === 'planifie' ? 'Planifié' : 'En cours'}</p>
                  {ot.date_debut && <p><strong>Début :</strong> {new Date(ot.date_debut).toLocaleString()}</p>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/ordres-travail/${ot.id}`}>
                    <Button variant="outline" size="small">
                      <FaEye /> Voir
                    </Button>
                  </Link>
                  {!isManager && ot.statut === 'planifie' && (
                    <Button size="small" variant="primary" onClick={() => handleDemarrer(ot.id)}>
                      <FaPlay /> Démarrer
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default OTEnCours;