import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaPlus, FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import { rapportService } from '../../services/rapportService';
import { authService } from '../../services/authService';
import './Rapports.css';

const RapportHebdomadaireList = () => {
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const user = authService.getCurrentUser();
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  useEffect(() => {
    chargerRapports();
  }, []);

  const chargerRapports = async () => {
    try {
      const data = await rapportService.getHebdomadaires();
      setRapports(data);
    } catch (error) {
      console.error('Erreur chargement rapports', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce rapport ?')) return;
    try {
      await rapportService.deleteHebdomadaire(id);
      chargerRapports();
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const filteredRapports = rapports.filter(r => 
    r.cadre_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.technicien_name && r.technicien_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Rapports hebdomadaires</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.5rem', width: '250px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <Link to="/rapports/hebdomadaire/nouveau">
            <Button variant="primary"><FaPlus /> Nouveau rapport</Button>
          </Link>
        </div>
      </div>

      <Card>
        <table className="table">
          <thead>
            <tr>
              <th>Période</th>
              <th>Cadre / Technicien</th>
              <th>Planning</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRapports.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center' }}>Aucun rapport trouvé</td>
              </tr>
            ) : (
              filteredRapports.map(r => (
                <tr key={r.id}>
                  <td>{new Date(r.date_debut).toLocaleDateString()} - {new Date(r.date_fin).toLocaleDateString()}</td>
                  <td>{r.cadre_name || r.technicien_name}</td>
                  <td>{r.planning ? 'Oui' : 'Non'}</td>
                  <td>
                    <Link to={`/rapports/hebdomadaire/${r.id}`}>
                      <Button size="small" variant="outline"><FaEye /></Button>
                    </Link>
                    {(isManager || r.cadre === user?.id) && (
                      <>
                        <Link to={`/rapports/hebdomadaire/modifier/${r.id}`}>
                          <Button size="small" variant="outline"><FaEdit /></Button>
                        </Link>
                        <Button size="small" variant="outline" onClick={() => handleDelete(r.id)}>
                          <FaTrash />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default RapportHebdomadaireList;