import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import api from '../../services/api';
import { FaEdit, FaSave, FaTimes, FaEnvelope, FaPhone, FaMoneyBill, FaUser } from 'react-icons/fa';

const TechnicianList = () => {
  const [techniciens, setTechniciens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    chargerTechniciens();
  }, []);

  const chargerTechniciens = async () => {
    try {
      const data = await api.get('/technicians/');
      setTechniciens(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur:', error);
      setTechniciens([]);
    } finally {
      setLoading(false);
    }
  };

  const updateTauxHoraire = async (id, taux) => {
    try {
      await api.patch(`/technicians/${id}/`, { taux_horaire: parseInt(taux) || 0 });
      setEditingId(null);
      chargerTechniciens();
      alert('Taux horaire mis à jour');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Gestion des techniciens</h1>
        <p style={{ color: '#666' }}>Définir le taux horaire de chaque technicien (FCFA/h)</p>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {techniciens.length === 0 ? (
          <Card><p>Aucun technicien trouvé.</p></Card>
        ) : (
          techniciens.map(tech => (
            <Card key={tech.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <FaUser style={{ color: '#3b82f6' }} />
                    <h3 style={{ margin: 0 }}>{tech.username}</h3>
                    <span style={{ background: '#e0e0e0', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                      {tech.first_name} {tech.last_name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666', fontSize: '0.8rem' }}>
                      <FaEnvelope size={12} /> {tech.email}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666', fontSize: '0.8rem' }}>
                      <FaPhone size={12} /> {tech.phone || '-'}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {editingId === tech.id ? (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Taux horaire (FCFA)"
                        style={{ width: '180px' }}
                      />
                      <Button size="small" variant="primary" onClick={() => updateTauxHoraire(tech.id, editValue)}>
                        <FaSave /> Enregistrer
                      </Button>
                      <Button size="small" variant="outline" onClick={() => setEditingId(null)}>
                        <FaTimes /> Annuler
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', margin: '0 0 0.5rem 0' }}>
                        <FaMoneyBill style={{ color: '#10b981' }} />
                        <strong>Taux horaire:</strong>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>
                          {tech.taux_horaire?.toLocaleString('fr-FR') || '0'} FCFA/h
                        </span>
                      </p>
                      <Button size="small" variant="outline" onClick={() => {
                        setEditingId(tech.id);
                        setEditValue(tech.taux_horaire || '');
                      }}>
                        <FaEdit /> Modifier
                      </Button>
                    </div>
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

export default TechnicianList;