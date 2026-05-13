import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaArrowLeft, FaClock, FaFileAlt, FaImage, FaFilePdf, FaEnvelope, FaCalendarAlt, FaDownload } from 'react-icons/fa';
import { projetService } from '../../services/projetService';
import { authService } from '../../services/authService';

const ProjetHistorique = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projet, setProjet] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    chargerProjet();
    chargerHistorique();
  }, [id]);

  const chargerProjet = async () => {
    try {
      const data = await projetService.getById(id);
      setProjet(data);
    } catch (error) {
      console.error('Erreur chargement projet', error);
    }
  };

  const chargerHistorique = async () => {
    setLoading(true);
    try {
      const data = await projetService.getHistorique(id);
      setHistorique(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement historique', error);
      setHistorique([]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'heure': return <FaClock style={{ color: '#3b82f6' }} />;
      case 'suivi': return <FaClock style={{ color: '#3b82f6' }} />;
      case 'photo': return <FaImage style={{ color: '#8b5cf6' }} />;
      case 'pdf': return <FaFilePdf style={{ color: '#ef4444' }} />;
      case 'email': return <FaEnvelope style={{ color: '#f59e0b' }} />;
      case 'bl': return <FaFileAlt style={{ color: '#10b981' }} />;
      case 'pv': return <FaFileAlt style={{ color: '#10b981' }} />;
      default: return <FaFileAlt style={{ color: '#6b7280' }} />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'heure': return 'Heures saisies';
      case 'suivi': return 'Suivi OT (heures)';
      case 'photo': return 'Photo';
      case 'pdf': return 'Document PDF';
      case 'email': return 'Email / Capture';
      case 'bl': return 'Bon de livraison';
      case 'pv': return 'Procès-verbal';
      default: return 'Document';
    }
  };

  const filteredHistorique = historique.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchTerm) {
      const text = `${item.description || ''} ${item.intervenant || ''} ${item.technicien || ''} ${item.nom || ''}`.toLowerCase();
      return text.includes(searchTerm.toLowerCase());
    }
    return true;
  });

  // Grouper par date
  const groupedByDate = filteredHistorique.reduce((acc, item) => {
    const date = new Date(item.date).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  if (loading) return <div className="loading">Chargement de l'historique...</div>;
  if (!projet) return <div>Projet non trouvé</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <Button variant="outline" onClick={() => navigate(`/projets/${id}`)}>
          <FaArrowLeft /> Retour au projet
        </Button>
        <h1>Historique du projet : {projet.nom}</h1>
      </div>

      <Card>
        {/* Filtres et recherche */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="🔍 Rechercher dans l'historique..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="all">Tous les événements</option>
            <option value="heure">Heures saisies</option>
            <option value="suivi">Suivis OT</option>
            <option value="photo">Photos</option>
            <option value="pdf">Documents PDF</option>
            <option value="email">Emails/Captures</option>
          </select>
        </div>

        {/* Chronologie */}
        {Object.keys(groupedByDate).length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Aucun événement dans l'historique.</p>
        ) : (
          Object.entries(groupedByDate).map(([date, items]) => (
            <div key={date} style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ 
                backgroundColor: '#f3f4f6', 
                padding: '0.5rem', 
                borderRadius: '4px',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <FaCalendarAlt /> {date}
              </h3>
              <div style={{ marginLeft: '1rem', borderLeft: '2px solid #e5e7eb', paddingLeft: '1rem' }}>
                {items.map((item, idx) => (
                  <div key={idx} style={{ 
                    marginBottom: '1rem', 
                    padding: '0.75rem', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {getIcon(item.type)}
                      <strong>{getTypeLabel(item.type)}</strong>
                      {(item.intervenant || item.technicien) && (
                        <span style={{ color: '#6b7280' }}>par {item.intervenant || item.technicien}</span>
                      )}
                      {item.ot_reference && (
                        <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>(OT: {item.ot_reference})</span>
                      )}
                      <span style={{ fontSize: '0.8rem', color: '#9ca3af', marginLeft: 'auto' }}>
                        {new Date(item.created_at || item.date).toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={{ marginLeft: '1.5rem' }}>
                      {item.heures && (
                        <p><strong>Heures :</strong> {item.heures} h</p>
                      )}
                      {item.description && (
                        <p><strong>Description :</strong> {item.description}</p>
                      )}
                      {item.nom && (
                        <p><strong>Fichier :</strong> {item.nom}</p>
                      )}
                      {item.fichier_url && (
                        <p>
                          <a href={item.fichier_url} target="_blank" rel="noopener noreferrer" download>
                            <FaDownload /> Télécharger
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <Button variant="outline" size="small" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            ↑ Haut de page
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ProjetHistorique;


