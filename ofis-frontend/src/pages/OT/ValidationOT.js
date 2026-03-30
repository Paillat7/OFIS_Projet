import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaCheck, FaTimes, FaEye, FaUpload, FaTrash } from 'react-icons/fa';
import { otService } from '../../services/otService';
import api from '../../services/api';
import './OT.css';

const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date.toLocaleString();
};

const ValidationOT = () => {
  const [ordres, setOrdres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedOt, setSelectedOt] = useState(null);
  const [uploadType, setUploadType] = useState('photo');
  const [uploadFile, setUploadFile] = useState(null);

  useEffect(() => {
    chargerOT();
  }, []);

  const chargerOT = async () => {
    setLoading(true);
    try {
      const data = await otService.getAll({ statut: 'termine' });
      setOrdres(data.filter(ot => ot.statut_validation === 'en_attente'));
    } catch (error) {
      console.error('Erreur chargement OT', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValider = async (id) => {
    if (window.confirm('Valider cet OT ?')) {
      try {
        await otService.valider(id);
        chargerOT();
      } catch (error) {
        alert('Erreur validation');
      }
    }
  };

  const handleRejeter = async (id) => {
    if (window.confirm('Rejeter cet OT ?')) {
      try {
        await otService.rejeter(id);
        chargerOT();
      } catch (error) {
        alert('Erreur rejet');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer définitivement cet OT ?')) {
      try {
        await otService.delete(id);
        chargerOT(); // recharger la liste après suppression
      } catch (error) {
        console.error(error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedOt || !uploadFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('type', uploadType);
    formData.append('fichier', uploadFile);
    try {
      await otService.uploadDocument(selectedOt.id, formData);
      alert('Document ajouté');
      setUploadFile(null);
      setSelectedOt(null);
    } catch (err) {
      alert('Erreur upload');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Validation des ordres de travail</h1>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {ordres.length === 0 ? (
          <Card style={{ padding: '2rem', textAlign: 'center' }}>
            <p>Aucun OT en attente de validation.</p>
          </Card>
        ) : (
          ordres.map(ot => (
            <Card key={ot.id} className="ordre-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap' }}>
                <div>
                  <h3>{ot.reference} - {ot.mission_title}</h3>
                  <p><strong>Technicien :</strong> {ot.technicien_username}</p>
                  {ot.bon_commande_numero && <p><strong>Bon :</strong> {ot.bon_commande_numero}</p>}
                  {ot.reference_externe && <p><strong>Réf. SAGE :</strong> {ot.reference_externe}</p>}
                  {formatDate(ot.date_fin) && <p><strong>Fin :</strong> {formatDate(ot.date_fin)}</p>}
                  {ot.documents && ot.documents.length > 0 && (
                    <p><strong>Documents :</strong> {ot.documents.length} fichier(s)</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <Link to={`/ordres-travail/${ot.id}`}>
                    <Button variant="outline" size="small" title="Voir détails">
                      <FaEye />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => setSelectedOt(ot)}
                    title="Ajouter un document"
                  >
                    <FaUpload />
                  </Button>
                  <Button variant="primary" size="small" onClick={() => handleValider(ot.id)}>
                    <FaCheck /> Valider
                  </Button>
                  <Button variant="danger" size="small" onClick={() => handleRejeter(ot.id)}>
                    <FaTimes /> Rejeter
                  </Button>
                  <Button variant="danger" size="small" onClick={() => handleDelete(ot.id)}>
                    <FaTrash /> Supprimer
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Section d'upload (inchangée) */}
      {selectedOt && (
        <Card style={{ marginTop: '2rem', padding: '1rem' }}>
          <h3>Ajouter un document pour {selectedOt.reference}</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={uploadType} onChange={(e) => setUploadType(e.target.value)} style={{ padding: '0.5rem' }}>
              <option value="photo">Photo</option>
              <option value="pv">Procès-verbal</option>
              <option value="bl">Bon de livraison</option>
              <option value="qualite">Fiche qualité</option>
              <option value="autre">Autre</option>
            </select>
            <input type="file" onChange={(e) => setUploadFile(e.target.files[0])} />
            <Button onClick={handleUpload} disabled={!uploadFile || uploading}>
              {uploading ? 'Envoi...' : 'Ajouter'}
            </Button>
            <Button variant="outline" onClick={() => setSelectedOt(null)}>Annuler</Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ValidationOT;