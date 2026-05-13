import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaArrowLeft, FaChevronLeft, FaChevronRight, FaSearch, FaEye, FaPaperclip, FaImage, FaFilePdf, FaEnvelope, FaHistory } from 'react-icons/fa';
import api from '../../services/api';
import { authService } from '../../services/authService';

const OTTimeline = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ot, setOt] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTimeline, setFilteredTimeline] = useState([]);

  useEffect(() => {
    chargerOT();
    chargerTimeline();
  }, [id]);

  const chargerOT = async () => {
    try {
      const data = await api.get(`/ordres-travail/${id}/`);
      setOt(data);
    } catch (error) {
      console.error('Erreur chargement OT', error);
    }
  };

  const chargerTimeline = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/ordres-travail/${id}/timeline/`);
      setTimeline(data);
      
      const dates = [...new Set(data.map(item => item.date))].sort();
      setAvailableDates(dates);
      if (dates.length > 0 && !currentDate) {
        setCurrentDate(dates[0]);
      }
    } catch (error) {
      console.error('Erreur chargement timeline', error);
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const filtered = timeline.filter(item =>
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nature?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.technicien?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTimeline(filtered);
    } else {
      setFilteredTimeline(timeline);
    }
  }, [searchTerm, timeline]);

  const getCurrentDayEvents = () => {
    if (!currentDate) return [];
    return filteredTimeline.filter(item => item.date === currentDate);
  };

  const goToPrevDay = () => {
    const currentIndex = availableDates.indexOf(currentDate);
    if (currentIndex > 0) {
      setCurrentDate(availableDates[currentIndex - 1]);
    }
  };

  const goToNextDay = () => {
    const currentIndex = availableDates.indexOf(currentDate);
    if (currentIndex < availableDates.length - 1) {
      setCurrentDate(availableDates[currentIndex + 1]);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getIconForDoc = (type) => {
    switch (type) {
      case 'photo': return <FaImage style={{ color: '#8b5cf6' }} />;
      case 'pdf': return <FaFilePdf style={{ color: '#ef4444' }} />;
      case 'screenshot': return <FaEnvelope style={{ color: '#f59e0b' }} />;
      default: return <FaPaperclip style={{ color: '#6b7280' }} />;
    }
  };

  if (loading) return <div className="loading" style={{ textAlign: 'center', padding: '2rem' }}>Chargement de la timeline...</div>;
  if (!ot) return <div>OT non trouvé</div>;

  const currentEvents = getCurrentDayEvents();

  return (
    <div className="dashboard-page" style={{ padding: '1rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Button variant="outline" onClick={() => navigate(`/ordres-travail/${id}`)}>
          <FaArrowLeft /> Retour à l'OT
        </Button>
        <h1 style={{ margin: 0 }}>Timeline - {ot.reference}</h1>
      </div>

      <Card style={{ marginBottom: '1rem' }}>
        <p><strong>Objet :</strong> {ot.objet || '-'}</p>
        <p><strong>Client :</strong> {ot.client_rapport_name || '-'}</p>
        <p><strong>Statut :</strong> {ot.statut === 'planifie' ? 'Planifié' : ot.statut === 'en_cours' ? 'En cours' : 'Terminé'}</p>
      </Card>

      <Card style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Button variant="outline" size="sm" onClick={goToPrevDay} disabled={availableDates.indexOf(currentDate) <= 0}>
              <FaChevronLeft /> Jour précédent
            </Button>
            <span style={{ fontWeight: 'bold', minWidth: '250px', textAlign: 'center' }}>
              {currentDate ? formatDate(currentDate) : 'Aucune intervention'}
            </span>
            <Button variant="outline" size="sm" onClick={goToNextDay} disabled={availableDates.indexOf(currentDate) >= availableDates.length - 1}>
              Jour suivant <FaChevronRight />
            </Button>
          </div>
          <div style={{ position: 'relative', width: '250px' }}>
            <FaSearch style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <input
              type="text"
              placeholder="Rechercher Ctrl+F..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
        </div>
      </Card>

      {currentEvents.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Aucune intervention ce jour
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {currentEvents.map((event, idx) => (
            <Card key={idx} style={{ borderLeft: `4px solid ${event.rit_signe ? '#10b981' : '#f59e0b'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <span style={{ background: '#e0e0e0', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                      🕐 {event.date_debut || '-'} → {event.date_fin || '-'}
                    </span>
                    <span style={{ background: '#DBEAFE', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                      <FaEye style={{ marginRight: '0.25rem' }} /> {event.technicien}
                    </span>
                    <span style={{ background: '#E8F5E9', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                      ⏱ {event.duree} h
                    </span>
                    {event.rit_signe && <span style={{ color: '#10b981' }}>✅ RIT signé</span>}
                    {event.pv_signe && <span style={{ color: '#10b981' }}>✅ PV signé</span>}
                  </div>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>{event.nature}</h4>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>{event.description}</p>
                  {event.avancement && (
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
                      📈 Avancement: {event.avancement}
                    </p>
                  )}
                  {event.documents && event.documents.length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {event.documents.map((doc, docIdx) => (
                        <a key={docIdx} href={doc.fichier_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#f0f0f0', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', textDecoration: 'none', color: '#1976D2' }}>
                          {getIconForDoc(doc.type)} {doc.nom}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {availableDates.length > 1 && (
        <Card style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {availableDates.map(date => (
              <button
                key={date}
                onClick={() => setCurrentDate(date)}
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  border: 'none',
                  background: currentDate === date ? '#1976D2' : '#f0f0f0',
                  color: currentDate === date ? 'white' : '#333',
                  cursor: 'pointer'
                }}
              >
                {new Date(date).toLocaleDateString()}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default OTTimeline;