import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaArrowLeft, FaPlus, FaTrash, FaFileAlt, FaDownload, FaHistory } from 'react-icons/fa';
import { otService } from '../../services/otService';
import api from '../../services/api';
import { authService } from '../../services/authService';
import SuiviOTSection from './SuiviOTSection';

const OrdreTravailDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ot, setOt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sousOts, setSousOts] = useState([]);
  const [techniciensDisponibles, setTechniciensDisponibles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('photo');
  const [uploadFile, setUploadFile] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const user = authService.getCurrentUser();
  const isStaff = user?.role === 'manager' || user?.role === 'admin';
  const isAssistant = user?.role === 'assistant';

  useEffect(() => {
    chargerOT();
    chargerSousOts();
    chargerTechniciens();
  }, [id]);

  const chargerOT = async () => {
    try {
      const data = await otService.getById(id);
      setOt(data);
    } catch (error) {
      console.error('Erreur chargement OT', error);
    } finally {
      setLoading(false);
    }
  };

  const chargerSousOts = async () => {
    try {
      const data = await api.get(`/ordres-travail/${id}/sous_ots/`);
      setSousOts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement sous-OT', error);
      setSousOts([]);
    }
  };

  const chargerTechniciens = async () => {
    try {
      const users = await api.getUsers();
      const techniciens = users.filter(u => !u.is_staff && !u.is_superuser);
      setTechniciensDisponibles(techniciens);
    } catch (error) {
      console.error('Erreur chargement techniciens', error);
      setTechniciensDisponibles([]);
    }
  };

  const ajouterTechnicien = async (technicienId) => {
    if (!technicienId) return;
    try {
      await api.post(`/ordres-travail/${id}/ajouter_technicien/`, { technicien_id: technicienId });
      chargerOT();
    } catch (error) {
      alert('Erreur lors de l\'ajout du technicien');
    }
  };

  const retirerTechnicien = async (technicienId) => {
    if (!window.confirm('Retirer ce technicien de l\'OT ?')) return;
    try {
      await api.post(`/ordres-travail/${id}/retirer_technicien/`, { technicien_id: technicienId });
      chargerOT();
    } catch (error) {
      alert('Erreur lors du retrait du technicien');
    }
  };

  const handleDemarrer = async () => {
    if (window.confirm('Démarrer cet OT ?')) {
      try {
        await otService.demarrer(id);
        chargerOT();
        alert('OT démarré avec succès');
      } catch (error) {
        alert('Erreur au démarrage');
      }
    }
  };

  const handleTerminer = async () => {
    if (window.confirm('Terminer cet OT ?')) {
      try {
        await otService.terminer(id);
        chargerOT();
        alert('OT terminé, en attente de validation');
      } catch (error) {
        alert('Erreur à la terminaison');
      }
    }
  };

  const handleValider = async () => {
    if (window.confirm('Valider cet OT ?')) {
      try {
        await otService.valider(id);
        chargerOT();
        alert('OT validé avec succès');
      } catch (error) {
        alert('Erreur validation');
      }
    }
  };

  const handleRejeter = async () => {
    if (window.confirm('Rejeter cet OT ?')) {
      try {
        await otService.rejeter(id);
        chargerOT();
        alert('OT rejeté');
      } catch (error) {
        alert('Erreur rejet');
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      alert('Veuillez sélectionner un fichier');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('type', uploadType);
    formData.append('fichier', uploadFile);
    try {
      await otService.uploadDocument(id, formData);
      alert('Document ajouté avec succès');
      setUploadFile(null);
      setShowUpload(false);
      chargerOT();
    } catch (err) {
      console.error('Erreur upload:', err);
      alert('Erreur lors de l\'upload: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Supprimer ce document ?')) return;
    try {
      await api.delete(`/documents-ot/${docId}/`);
      chargerOT();
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (!ot) return <div>OT non trouvé</div>;

  const isTechnicien = ot.techniciens_ids?.includes(user?.id);
  const peutDemarrer = ot.statut === 'planifie' && (isStaff || isTechnicien);
  const peutTerminer = true;
  const peutGerer = isStaff;
  const peutAjouterDocument = isStaff || isTechnicien || isAssistant;
  const peutSupprimerDocument = isStaff;
  const premierTechnicienId = ot.techniciens_ids?.[0];

  const getFileUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `http://localhost:8000${url}`;
    return `http://localhost:8000/media/ot_documents/${url}`;
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Retour
        </Button>
        <h1>{ot.reference} - {ot.objet || 'Sans objet'}</h1>
      </div>

      <Card>
        <p><strong>Référence OT :</strong> {ot.reference}</p>
        <p><strong>Réf. bon de commande :</strong> {ot.reference_externe || '-'}</p>
        <p><strong>Objet :</strong> {ot.objet || '-'}</p>
        <p><strong>Lieu :</strong> {ot.lieu || '-'}</p>
        <p><strong>Client :</strong> {ot.client_rapport_name || '-'}</p>
        <p><strong>Statut :</strong> {ot.statut === 'planifie' ? 'Planifié' : ot.statut === 'en_cours' ? 'En cours' : 'Terminé'}</p>
        <p><strong>Statut validation :</strong> {ot.statut_validation === 'en_attente' ? 'En attente' : ot.statut_validation === 'valide' ? 'Validé' : 'Rejeté'}</p>
        <p><strong>Estimation :</strong> {ot.estimation_heures ? `${ot.estimation_heures} h` : '-'}</p>
        <p><strong>Heures consommées :</strong> {ot.heures_consommees || 0} h</p>
        <p><strong>Avancement :</strong> {ot.avancement || 0}%</p>
        <p><strong>Date création :</strong> {new Date(ot.date_creation).toLocaleString()}</p>
        {ot.date_debut && <p><strong>Date début :</strong> {new Date(ot.date_debut).toLocaleString()}</p>}
        {ot.date_fin && <p><strong>Date fin :</strong> {new Date(ot.date_fin).toLocaleString()}</p>}
        {ot.date_validation && <p><strong>Date validation :</strong> {new Date(ot.date_validation).toLocaleString()}</p>}

        <h3>Techniciens assignés</h3>
        {ot.techniciens_names?.length === 0 ? (
          <p>Aucun technicien assigné</p>
        ) : (
          <ul>
            {ot.techniciens_names?.map((name, idx) => (
              <li key={idx}>
                {name}
                {peutGerer && (
                  <Button size="small" variant="danger" onClick={() => retirerTechnicien(ot.techniciens_ids[idx])}>
                    <FaTrash /> Retirer
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {peutGerer && techniciensDisponibles.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <label>Ajouter un technicien : </label>
            <select 
              onChange={(e) => ajouterTechnicien(e.target.value)} 
              defaultValue=""
            >
              <option value="">-- Sélectionner --</option>
              {techniciensDisponibles
                .filter(t => !ot.techniciens_ids?.includes(t.id))
                .map(t => (
                  <option key={t.id} value={t.id}>{t.username}</option>
                ))}
            </select>
          </div>
        )}

        {/* SECTION SUIVI DES HEURES */}
        {premierTechnicienId && (
          <SuiviOTSection 
            otId={ot.id} 
            dureeEstimee={ot.estimation_heures}
          />
        )}

        {/* SECTION DOCUMENTS */}
        <h3>Documents joints</h3>
        {peutAjouterDocument && (
          <div style={{ marginBottom: '1rem' }}>
            {!showUpload ? (
              <Button variant="outline" size="small" onClick={() => setShowUpload(true)}>
                <FaPlus /> Ajouter un document
              </Button>
            ) : (
              <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <h4>Ajouter une preuve de Justification de votre travail</h4>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select 
                    value={uploadType} 
                    onChange={(e) => setUploadType(e.target.value)} 
                    style={{ padding: '0.5rem' }}
                  >
                    <option value="photo">Photo (travail effectué)</option>
                    <option value="screenshot">Capture d'écran / Email</option>
                    <option value="pdf">PDF reçu / Document</option>
                    <option value="cr">Compte rendu de réunion</option>
                    <option value="autre">Autre</option>
                  </select>
                  <input type="file" onChange={(e) => setUploadFile(e.target.files[0])} />
                  <Button onClick={handleUpload} disabled={!uploadFile || uploading}>
                    {uploading ? 'Envoi...' : 'Ajouter'}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowUpload(false); setUploadFile(null); }}>
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {ot.documents?.length === 0 ? (
          <p>Aucun document joint.</p>
        ) : (
          <ul>
            {ot.documents?.map(doc => {
              const fileUrl = getFileUrl(doc.fichier_url);
              return (
                <li key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <FaFileAlt />
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                    {doc.nom} ({doc.type === 'photo' ? 'Photo' : doc.type === 'screenshot' ? 'Capture/Email' : doc.type === 'pdf' ? 'PDF' : doc.type === 'cr' ? 'Compte rendu' : 'Autre'})
                  </a>
                  <a href={fileUrl} download style={{ marginLeft: 'auto' }}>
                    <FaDownload /> Télécharger
                  </a>
                  {peutSupprimerDocument && (
                    <Button size="small" variant="danger" onClick={() => handleDeleteDocument(doc.id)}>
                      <FaTrash />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <h3>Sous-OT</h3>
        {sousOts.length === 0 ? (
          <p>Aucun sous-OT</p>
        ) : (
          <ul>
            {sousOts.map(sot => (
              <li key={sot.id}>
                <Link to={`/ordres-travail/${sot.id}`}>{sot.reference} - {sot.objet}</Link>
              </li>
            ))}
          </ul>
        )}

        {peutGerer && (
          <Link to={`/ordres-travail/nouveau?parent=${ot.id}`}>
            <Button variant="outline" size="small"><FaPlus /> Ajouter un sous-OT</Button>
          </Link>
        )}

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {peutDemarrer && (
            <Button variant="primary" onClick={handleDemarrer}>Démarrer l'OT</Button>
          )}
          <Button variant="primary" onClick={handleTerminer}>Terminer l'OT</Button>
          {isStaff && ot.statut === 'termine' && ot.statut_validation === 'en_attente' && (
            <>
              <Button variant="success" onClick={handleValider}>Valider</Button>
              <Button variant="danger" onClick={handleRejeter}>Rejeter</Button>
            </>
          )}
          {/* LIEN VERS L'HISTORIQUE */}
          <Link to={`/ordres-travail/${ot.id}/historique`}>
            <Button variant="outline" size="small">
              <FaHistory /> Historique
            </Button>
          </Link>
          {/* LIEN VERS LA TIMELINE - AJOUTÉ */}
          <Link to={`/ordres-travail/${ot.id}/timeline`}>
            <Button variant="outline" size="small">
              <FaHistory /> Vue timeline
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default OrdreTravailDetail;