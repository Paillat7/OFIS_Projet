import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { 
  FaFileExcel, FaFilePdf, FaChartBar, FaPlus, 
  FaDownload, FaHistory, FaCalendarAlt, FaChartLine,
  FaFileAlt, FaTrash, FaEdit, FaEye, FaUpload
} from 'react-icons/fa';
import api from '../services/api';
import './Pages.css';

const ReportsPage = () => {
  // ===== ÉTATS =====
  const [reports, setReports] = useState([]);           // Liste des rapports
  const [loading, setLoading] = useState(true);         // État de chargement
  const [stats, setStats] = useState(null);              // Statistiques
  const [showCreateModal, setShowCreateModal] = useState(false); // Modal création
  const [showUploadModal, setShowUploadModal] = useState(false);  // Modal upload
  const [selectedReport, setSelectedReport] = useState(null);
  
  // États pour l'upload de fichier
  const [uploadFile, setUploadFile] = useState(null);    // Fichier sélectionné
  const [uploadTitle, setUploadTitle] = useState('');    // Titre du rapport
  const [uploadDescription, setUploadDescription] = useState(''); // Description
  const [uploading, setUploading] = useState(false);     // État d'upload
  
  // Formulaire de création
  const [formData, setFormData] = useState({
    title: '',
    report_type: 'mensuel',
    format: 'pdf',
    description: '',
    parameters: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      client_id: ''
    }
  });

  // ===== CHARGEMENT DES DONNÉES =====
  useEffect(() => {
    console.log("🔄 Chargement initial des rapports...");
    loadReports();
    loadStats();
  }, []);

  // Charge la liste des rapports depuis le backend
  const loadReports = async () => {
    console.log("📥 Chargement des rapports...");
    setLoading(true);
    try {
      const token = localStorage.getItem('ofis_token');
      console.log("🔑 Token utilisé:", token ? "Présent" : "MANQUANT");
      
      const response = await fetch('http://localhost:8000/api/generated-reports/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log("📊 Status réponse loadReports:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Rapports chargés:", data);
        setReports(Array.isArray(data) ? data : []);
      } else {
        console.error("❌ Erreur chargement rapports:", response.status);
        setReports([]);
      }
    } catch (error) {
      console.error("❌ Exception chargement rapports:", error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // Charge les statistiques
  const loadStats = async () => {
    console.log("📊 Chargement des statistiques...");
    try {
      const token = localStorage.getItem('ofis_token');
      const response = await fetch('http://localhost:8000/api/generated-reports/stats/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Statistiques chargées:", data);
        setStats(data);
      } else {
        console.error("❌ Erreur chargement stats:", response.status);
      }
    } catch (error) {
      console.error("❌ Exception chargement stats:", error);
    }
  };

  // ===== GESTION DES RAPPORTS =====

  // Crée un nouveau rapport
  const handleCreateReport = async () => {
    console.log("🟢 handleCreateReport appelé !");
    console.log("📤 Données du formulaire:", formData);
    
    // Vérification des champs requis
    if (!formData.title) {
      console.error("❌ Titre manquant");
      alert('Le titre est obligatoire');
      return;
    }
    
    try {
      const token = localStorage.getItem('ofis_token');
      console.log("🔑 Token:", token ? "Présent" : "MANQUANT");
      
      if (!token) {
        console.error("❌ Token manquant - Redirection vers login");
        alert('Veuillez vous reconnecter');
        window.location.href = '/login';
        return;
      }
      
      console.log("📡 Envoi au backend...");
      const response = await fetch('http://localhost:8000/api/generated-reports/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      console.log("📥 Status réponse:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Rapport créé avec succès:", data);
        setShowCreateModal(false);
        
        // Réinitialiser le formulaire
        setFormData({
          title: '',
          report_type: 'mensuel',
          format: 'pdf',
          description: '',
          parameters: {
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            client_id: ''
          }
        });
        
        loadReports();
        loadStats();
      } else {
        const errorText = await response.text();
        console.error("❌ Erreur backend:", response.status, errorText);
        try {
          const errorJson = JSON.parse(errorText);
          alert('Erreur: ' + JSON.stringify(errorJson));
        } catch {
          alert('Erreur ' + response.status + ': ' + errorText);
        }
      }
    } catch (error) {
      console.error("❌ Exception réseau:", error);
      alert('Erreur de connexion au backend. Vérifie que Django est lancé sur http://localhost:8000');
    }
  };

  // Génère un rapport
  const handleGenerate = async (reportId) => {
    console.log(`🔄 Génération du rapport ${reportId}...`);
    try {
      const token = localStorage.getItem('ofis_token');
      const response = await fetch(`http://localhost:8000/api/generated-reports/${reportId}/generate/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`📥 Status génération ${reportId}:`, response.status);
      
      if (response.ok) {
        console.log(`✅ Rapport ${reportId} généré`);
        loadReports();
      } else {
        console.error(`❌ Erreur génération ${reportId}:`, response.status);
      }
    } catch (error) {
      console.error(`❌ Exception génération ${reportId}:`, error);
    }
  };

  // ===== FONCTION CORRIGÉE POUR LE TÉLÉCHARGEMENT =====
  const handleDownload = async (reportId) => {
    console.log(`📥 Téléchargement du rapport ${reportId}...`);
    try {
      // Trouver le rapport dans la liste pour connaître son format
      const report = reports.find(r => r.id === reportId);
      
      const token = localStorage.getItem('ofis_token');
      const response = await fetch(`http://localhost:8000/api/generated-reports/${reportId}/download/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`📥 Status téléchargement ${reportId}:`, response.status);
      
      if (response.ok) {
        // Récupérer le nom du fichier depuis l'en-tête Content-Disposition
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `rapport-${reportId}`;
        
        // Essayer d'extraire le nom du fichier de l'en-tête
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        } else {
          // Si pas d'en-tête, utiliser le format du rapport
          const extension = report?.format ? `.${report.format}` : '.pdf';
          filename = `rapport-${reportId}${extension}`;
        }
        
        // Récupérer le blob et créer l'URL
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        console.log(`✅ Rapport ${reportId} téléchargé: ${filename}`);
        loadStats(); // Recharger les stats après téléchargement
      } else {
        console.error(`❌ Erreur téléchargement ${reportId}:`, response.status);
      }
    } catch (error) {
      console.error(`❌ Exception téléchargement ${reportId}:`, error);
    }
  };

  // Supprime un rapport
  const handleDelete = async (reportId) => {
    console.log(`🗑️ Suppression du rapport ${reportId}...`);
    if (!window.confirm('Supprimer ce rapport ?')) return;
    
    try {
      const token = localStorage.getItem('ofis_token');
      const response = await fetch(`http://localhost:8000/api/generated-reports/${reportId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`📥 Status suppression ${reportId}:`, response.status);
      
      if (response.ok) {
        console.log(`✅ Rapport ${reportId} supprimé`);
        loadReports();
        loadStats();
      } else {
        console.error(`❌ Erreur suppression ${reportId}:`, response.status);
      }
    } catch (error) {
      console.error(`❌ Exception suppression ${reportId}:`, error);
    }
  };

  // ===== FONCTION D'UPLOAD DE FICHIER =====
  const handleFileUpload = async () => {
    console.log("🟢 handleFileUpload appelé");
    
    // Vérification qu'un fichier est sélectionné
    if (!uploadFile) {
      console.error("❌ Aucun fichier sélectionné");
      alert('Veuillez sélectionner un fichier');
      return;
    }

    console.log("📤 Fichier à uploader:", uploadFile.name, uploadFile.size + " octets");
    setUploading(true);

    try {
      const token = localStorage.getItem('ofis_token');
      console.log("🔑 Token:", token ? "Présent" : "MANQUANT");
      
      if (!token) {
        console.error("❌ Token manquant");
        alert('Veuillez vous reconnecter');
        window.location.href = '/login';
        return;
      }
      
      // Créer un FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle || uploadFile.name);
      formData.append('description', uploadDescription);
      formData.append('report_type', 'depose');
      formData.append('format', uploadFile.name.split('.').pop().toLowerCase());

      console.log("📡 Envoi du fichier au backend...");
      
      // Envoyer au backend
      const response = await fetch('http://localhost:8000/api/generated-reports/upload/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Ne pas mettre Content-Type, il sera automatiquement défini
        },
        body: formData
      });

      console.log("📥 Status réponse upload:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Upload réussi:", data);
        alert('✅ Rapport déposé avec succès !');
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadTitle('');
        setUploadDescription('');
        loadReports(); // Recharger la liste
        loadStats(); // Recharger les stats
      } else {
        const errorText = await response.text();
        console.error("❌ Erreur upload:", response.status, errorText);
        try {
          const errorJson = JSON.parse(errorText);
          alert('❌ Erreur: ' + (errorJson.message || JSON.stringify(errorJson)));
        } catch {
          alert('❌ Erreur ' + response.status + ': ' + errorText);
        }
      }
    } catch (error) {
      console.error('❌ Exception upload:', error);
      alert('❌ Erreur lors du dépôt du fichier');
    } finally {
      setUploading(false);
    }
  };

  // ===== FONCTIONS UTILITAIRES =====

  // Formate une date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  };

  // Retourne l'icône selon le type de rapport
  const getTypeIcon = (type) => {
    switch(type) {
      case 'mensuel': return <FaCalendarAlt />;
      case 'client': return <FaChartBar />;
      case 'validation': return <FaChartLine />;
      default: return <FaFileAlt />;
    }
  };

  // Retourne le libellé selon le type
  const getTypeLabel = (type) => {
    switch(type) {
      case 'mensuel': return 'Mensuel';
      case 'client': return 'Par client';
      case 'validation': return 'Validation';
      case 'depose': return 'Déposé';
      default: return 'Personnalisé';
    }
  };

  // Affichage du chargement
  if (loading) {
    return <div className="loading">Chargement des rapports...</div>;
  }

  // ===== RENDU DU COMPOSANT =====
  return (
    <div className="dashboard-page">
      {/* En-tête avec titre et bouton de création */}
      <div className="page-header">
        <div>
          <h1>Rapports</h1>
          {stats && (
            <p style={{ color: '#666', marginTop: '0.5rem' }}>
              {stats.total_reports || 0} rapports • {stats.downloads_total || 0} téléchargements
            </p>
          )}
        </div>
        <Button variant="primary" onClick={() => {
          console.log("🟢 Clic sur Nouveau rapport");
          setShowCreateModal(true);
        }}>
          <FaPlus /> Nouveau rapport
        </Button>
      </div>

      {/* Statistiques (4 cartes) */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <Card style={{ padding: '1rem', textAlign: 'center' }}>
            <h3>Ce mois</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {stats.reports_this_month || 0}
            </p>
          </Card>
          <Card style={{ padding: '1rem', textAlign: 'center' }}>
            <h3>Cette semaine</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
              {stats.reports_this_week || 0}
            </p>
          </Card>
          <Card style={{ padding: '1rem', textAlign: 'center' }}>
            <h3>Aujourd'hui</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {stats.generated_today || 0}
            </p>
          </Card>
          <Card style={{ padding: '1rem', textAlign: 'center' }}>
            <h3>Téléchargements</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
              {stats.downloads_total || 0}
            </p>
          </Card>
        </div>
      )}

      {/* Grille des rapports */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        
        {/* Liste des rapports existants */}
        {Array.isArray(reports) && reports.length > 0 ? (
          reports.map(report => (
            <Card key={report.id} className="report-card">
              <div style={{ padding: '1.5rem' }}>
                {/* En-tête avec icône et titre */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: report.is_generated ? '#d1fae5' : '#fee2e2',
                    color: report.is_generated ? '#065f46' : '#991b1b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem'
                  }}>
                    {getTypeIcon(report.report_type)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>{report.title || 'Sans titre'}</h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#666' }}>
                      {formatDate(report.created_at)}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {report.description || 'Aucune description'}
                </p>

                {/* Badges (type, format, statut) */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    fontSize: '0.8rem'
                  }}>
                    {getTypeLabel(report.report_type)}
                  </span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: '#f3e8ff',
                    color: '#6b21a8',
                    fontSize: '0.8rem'
                  }}>
                    {report.format?.toUpperCase() || 'PDF'}
                  </span>
                  {report.is_generated && (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: '#d1fae5',
                      color: '#065f46',
                      fontSize: '0.8rem'
                    }}>
                      ✓ Généré
                    </span>
                  )}
                </div>

                {/* Pied de carte avec compteur et boutons */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {report.download_count || 0} téléchargement(s)
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!report.is_generated && (
                      <Button 
                        size="small" 
                        variant="outline"
                        onClick={() => handleGenerate(report.id)}
                      >
                        Générer
                      </Button>
                    )}
                    {report.is_generated && (
                      <Button 
                        size="small" 
                        variant="outline"
                        onClick={() => handleDownload(report.id)}
                      >
                        <FaDownload /> Télécharger
                      </Button>
                    )}
                    <Button 
                      size="small" 
                      variant="outline"
                      onClick={() => handleDelete(report.id)}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          // Message si aucun rapport
          <Card style={{ padding: '3rem', textAlign: 'center', gridColumn: '1 / -1' }}>
            <FaFileAlt size={48} color="#9ca3af" />
            <h3 style={{ margin: '1rem 0', color: '#6b7280' }}>Aucun rapport</h3>
            <p>Commencez par créer votre premier rapport.</p>
            <Button variant="primary" onClick={() => {
              console.log("🟢 Clic sur Créer un rapport (depuis message vide)");
              setShowCreateModal(true);
            }}>
              <FaPlus /> Créer un rapport
            </Button>
          </Card>
        )}

        {/* ===== CARTE "DÉPOSER UN RAPPORT" ===== */}
        <Card className="report-card" style={{ backgroundColor: '#f0f9ff' }}>
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#dbeafe',
              color: '#1E6FD9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1rem'
            }}>
              <FaPlus />
            </div>
            <h3>Déposer un rapport</h3>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Déposer un nouveau rapport (PDF, Excel, Word...)
            </p>
            <Button variant="primary" onClick={() => {
              console.log("🟢 Clic sur Déposer un rapport");
              setShowUploadModal(true);
            }}>
              <FaUpload /> Déposer
            </Button>
          </div>
        </Card>
      </div>

      {/* ===== MODAL DE CRÉATION DE RAPPORT ===== */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            console.log("🔴 Fermeture modal création");
            setShowCreateModal(false);
          }}
          title="Créer un nouveau rapport"
        >
          <form onSubmit={(e) => { 
            e.preventDefault(); 
            console.log("🟢 Formulaire soumis !");
            handleCreateReport(); 
          }}>
            <Input
              label="Titre du rapport"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                Type de rapport
              </label>
              <select
                value={formData.report_type}
                onChange={(e) => setFormData({...formData, report_type: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px'
                }}
              >
                <option value="mensuel">Rapport mensuel</option>
                <option value="client">Par client</option>
                <option value="validation">Validation</option>
                <option value="personnalise">Personnalisé</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                Format
              </label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({...formData, format: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px'
                }}
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
            </div>

            <Input
              label="Description"
              textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="3"
            />

            {formData.report_type === 'mensuel' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                  label="Année"
                  type="number"
                  value={formData.parameters.year}
                  onChange={(e) => setFormData({
                    ...formData, 
                    parameters: {...formData.parameters, year: parseInt(e.target.value) || new Date().getFullYear()}
                  })}
                />
                <Input
                  label="Mois"
                  type="number"
                  min="1"
                  max="12"
                  value={formData.parameters.month}
                  onChange={(e) => setFormData({
                    ...formData, 
                    parameters: {...formData.parameters, month: parseInt(e.target.value) || 1}
                  })}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button variant="outline" onClick={() => {
                console.log("🔴 Annulation création");
                setShowCreateModal(false);
              }}>
                Annuler
              </Button>
              <Button type="submit" variant="primary">
                Créer le rapport
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ===== MODAL DE DÉPÔT DE FICHIER ===== */}
      {showUploadModal && (
        <Modal
          isOpen={showUploadModal}
          onClose={() => {
            console.log("🔴 Fermeture modal upload");
            setShowUploadModal(false);
            setUploadFile(null);
            setUploadTitle('');
            setUploadDescription('');
          }}
          title="Déposer un rapport"
        >
          <form onSubmit={(e) => { 
            e.preventDefault(); 
            console.log("🟢 Formulaire d'upload soumis !");
            handleFileUpload(); 
          }}>
            {/* Champ de sélection de fichier */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                Fichier *
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                onChange={(e) => {
                  console.log("📁 Fichier sélectionné:", e.target.files[0]?.name);
                  setUploadFile(e.target.files[0]);
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px'
                }}
                required
              />
              {uploadFile && (
                <div style={{ 
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}>
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>Fichier:</strong> {uploadFile.name}
                  </p>
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>Taille:</strong> {(uploadFile.size / 1024).toFixed(2)} Ko
                  </p>
                </div>
              )}
            </div>

            {/* Titre (optionnel) */}
            <Input
              label="Titre (optionnel)"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="Laissez vide pour utiliser le nom du fichier"
            />

            {/* Description (optionnel) */}
            <Input
              label="Description"
              textarea
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              rows="3"
              placeholder="Description du rapport (optionnel)"
            />

            {/* Boutons */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button 
                variant="outline" 
                onClick={() => {
                  console.log("🔴 Annulation upload");
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadTitle('');
                  setUploadDescription('');
                }}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                disabled={!uploadFile || uploading}
              >
                {uploading ? 'Dépôt en cours...' : '📤 Déposer le rapport'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ReportsPage;