import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { 
  FaPlus, FaEdit, FaTrash, FaSearch,
  FaMapMarkerAlt, FaClock, FaUser, FaCalendarAlt,
  FaCheckCircle, FaHourglassHalf, FaUsers,
  FaPlay, FaStop
} from 'react-icons/fa';
import { teamService } from '../services/TeamService';
import { userService } from '../services/userService';
import api from '../services/api';
import './Pages.css';

const RealMissionsPage = () => {
  const [missions, setMissions] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [teams, setTeams] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);
  const [missionForm, setMissionForm] = useState({
    title: '',
    description: '',
    client: '',
    service: '',
    team: '',
    assigned_to: [],
    status: 'planifiee',
    priority: 'moyenne',
    location: '',
    start_date: '',
    end_date: '',
    estimated_hours: 0
  });

  useEffect(() => {
    loadAllData();
  }, [filter]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Missions avec filtre
      console.log('📥 Chargement des missions, filtre:', filter);
      const missionsData = await teamService.getMissions({ status: filter !== 'all' ? filter : null });
      console.log('📦 Missions reçues:', missionsData);
      setMissions(Array.isArray(missionsData) ? missionsData : []);

      // Services
      const servicesData = await teamService.getServices();
      setServices(Array.isArray(servicesData) ? servicesData : []);

      // Équipes
      const teamsData = await teamService.getTeams();
      setTeams(Array.isArray(teamsData) ? teamsData : []);

      // Clients
      const clientsData = await api.getClients();
      setClients(Array.isArray(clientsData) ? clientsData : []);

      // Techniciens (utilisateurs non staff)
      const users = await userService.getAll();
      if (Array.isArray(users)) {
        setTechnicians(users.filter(u => !u.is_staff && !u.is_superuser));
      } else {
        console.error('❌ userService.getAll() ne retourne pas un tableau:', users);
        setTechnicians([]);
      }

    } catch (error) {
      console.error('❌ Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMission = async () => {
    try {
      const missionData = {
        title: missionForm.title,
        description: missionForm.description,
        client: parseInt(missionForm.client),
        service: parseInt(missionForm.service),
        team: missionForm.team ? parseInt(missionForm.team) : null,
        assigned_to: missionForm.assigned_to.map(id => parseInt(id)),
        status: missionForm.status,
        priority: missionForm.priority,
        location: missionForm.location,
        start_date: missionForm.start_date,
        end_date: missionForm.end_date,
        estimated_hours: parseInt(missionForm.estimated_hours)
      };
      
      await teamService.createMission(missionData);
      await loadAllData();
      setShowAddModal(false);
      resetForm();
      alert('✅ Mission créée avec succès !');
    } catch (error) {
      console.error('❌ Erreur création:', error);
      alert('❌ Erreur création mission');
    }
  };

  const handleEditMission = async () => {
    try {
      const missionData = {
        title: missionForm.title,
        description: missionForm.description,
        client: parseInt(missionForm.client),
        service: parseInt(missionForm.service),
        team: missionForm.team ? parseInt(missionForm.team) : null,
        assigned_to: missionForm.assigned_to.map(id => parseInt(id)),
        status: missionForm.status,
        priority: missionForm.priority,
        location: missionForm.location,
        start_date: missionForm.start_date,
        end_date: missionForm.end_date,
        estimated_hours: parseInt(missionForm.estimated_hours)
      };
      
      await teamService.updateMission(selectedMission.id, missionData);
      await loadAllData();
      setShowEditModal(false);
      resetForm();
      alert('✅ Mission modifiée avec succès !');
    } catch (error) {
      console.error('❌ Erreur modification:', error);
      alert('❌ Erreur modification mission');
    }
  };

  const handleDeleteMission = async (id) => {
    if (window.confirm('Supprimer cette mission ?')) {
      try {
        await teamService.deleteMission(id);
        await loadAllData();
        alert('✅ Mission supprimée');
      } catch (error) {
        alert('❌ Erreur suppression');
      }
    }
  };

  const handleStartMission = async (id) => {
    try {
      await teamService.startMission(id);
      await loadAllData();
      alert('✅ Mission démarrée');
    } catch (error) {
      alert('❌ Erreur démarrage');
    }
  };

  const handleCompleteMission = async (id) => {
    const hours = prompt('Heures travaillées ?');
    if (hours) {
      try {
        await teamService.completeMission(id, parseInt(hours));
        await loadAllData();
        alert('✅ Mission terminée');
      } catch (error) {
        alert('❌ Erreur fin de mission');
      }
    }
  };

  const resetForm = () => {
    setMissionForm({
      title: '',
      description: '',
      client: '',
      service: '',
      team: '',
      assigned_to: [],
      status: 'planifiee',
      priority: 'moyenne',
      location: '',
      start_date: '',
      end_date: '',
      estimated_hours: 0
    });
  };

  const openEditModal = (mission) => {
    setSelectedMission(mission);
    setMissionForm({
      title: mission.title || '',
      description: mission.description || '',
      client: mission.client?.id || mission.client || '',
      service: mission.service?.id || mission.service || '',
      team: mission.team?.id || mission.team || '',
      assigned_to: mission.assigned_to_ids || [],
      status: mission.status || 'planifiee',
      priority: mission.priority || 'moyenne',
      location: mission.location || '',
      start_date: mission.start_date?.split('T')[0] || '',
      end_date: mission.end_date?.split('T')[0] || '',
      estimated_hours: mission.estimated_hours || 0
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (status) => {
    const config = {
      'planifiee': { color: '#f59e0b', icon: <FaClock />, text: 'Planifiée' },
      'en_cours': { color: '#10b981', icon: <FaHourglassHalf />, text: 'En cours' },
      'terminee': { color: '#6b7280', icon: <FaCheckCircle />, text: 'Terminée' }
    };
    const s = config[status] || config.planifiee;
    return (
      <span style={{
        backgroundColor: s.color + '20',
        color: s.color,
        padding: '4px 8px',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        {s.icon} {s.text}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const config = {
      'haute': { color: '#ef4444', text: 'Haute' },
      'moyenne': { color: '#f59e0b', text: 'Moyenne' },
      'basse': { color: '#10b981', text: 'Basse' }
    };
    const p = config[priority] || config.moyenne;
    return (
      <span style={{
        backgroundColor: p.color + '20',
        color: p.color,
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '0.7rem',
        fontWeight: 'bold'
      }}>
        {p.text}
      </span>
    );
  };

  const filteredMissions = missions.filter(m => 
    m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="dashboard-page">
      {/* En-tête */}
      <div className="page-header">
        <div>
          <h1>Gestion des missions terrain</h1>
          <p style={{ color: '#666', marginTop: '0.5rem' }}>
            {missions.filter(m => m.status === 'en_cours').length} en cours • 
            {missions.filter(m => m.status === 'planifiee').length} planifiées •
            {missions.filter(m => m.status === 'terminee').length} terminées
          </p>
        </div>
        <Button variant="primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
          <FaPlus /> Nouvelle mission
        </Button>
      </div>

      {/* Filtres */}
      <Card style={{ marginBottom: '2rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <FaSearch style={{ position: 'absolute', left: '10px', top: '12px', color: '#999' }} />
            <input
              type="text"
              placeholder="Rechercher une mission..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 35px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button 
              variant={filter === 'all' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setFilter('all')}
            >
              Toutes
            </Button>
            <Button 
              variant={filter === 'planifiee' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setFilter('planifiee')}
            >
              Planifiées
            </Button>
            <Button 
              variant={filter === 'en_cours' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setFilter('en_cours')}
            >
              En cours
            </Button>
            <Button 
              variant={filter === 'terminee' ? 'primary' : 'outline'}
              size="small"
              onClick={() => setFilter('terminee')}
            >
              Terminées
            </Button>
          </div>
        </div>
      </Card>

      {/* Liste des missions */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {filteredMissions.length === 0 ? (
          <Card style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: '#666' }}>Aucune mission trouvée</p>
            <Button variant="primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
              <FaPlus /> Créer une mission
            </Button>
          </Card>
        ) : (
          filteredMissions.map(mission => (
            <Card key={mission.id} className="mission-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0 }}>{mission.title}</h2>
                    {getStatusBadge(mission.status)}
                    {getPriorityBadge(mission.priority)}
                  </div>
                  
                  <p style={{ color: '#666', marginBottom: '1rem' }}>{mission.description}</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <FaUser style={{ color: '#1E6FD9', marginRight: '0.5rem' }} />
                      <strong>Client:</strong> {mission.client_name}
                    </div>
                    <div>
                      <FaMapMarkerAlt style={{ color: '#ef4444', marginRight: '0.5rem' }} />
                      <strong>Lieu:</strong> {mission.location}
                    </div>
                    <div>
                      <FaCalendarAlt style={{ color: '#f59e0b', marginRight: '0.5rem' }} />
                      <strong>Dates:</strong> {new Date(mission.start_date).toLocaleDateString()} - {new Date(mission.end_date).toLocaleDateString()}
                    </div>
                    <div>
                      <FaClock style={{ color: '#10b981', marginRight: '0.5rem' }} />
                      <strong>Estimé:</strong> {mission.estimated_hours}h
                      {mission.actual_hours && ` (réel: ${mission.actual_hours}h)`}
                    </div>
                  </div>

                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
                    <strong><FaUsers style={{ marginRight: '0.5rem' }} /> Techniciens assignés:</strong>{' '}
                    {mission.assigned_to_ids?.length > 0 ? (
                      mission.assigned_to_ids.map(id => {
                        const tech = technicians.find(t => t.id === id);
                        return tech?.username || id;
                      }).join(', ')
                    ) : 'Aucun technicien'}
                  </div>

                  {mission.service_name && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                      Service: {mission.service_name} • Équipe: {mission.team_name || 'Non assignée'}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="outline" size="small" onClick={() => openEditModal(mission)}>
                    <FaEdit />
                  </Button>
                  <Button variant="outline" size="small" onClick={() => handleDeleteMission(mission.id)}>
                    <FaTrash />
                  </Button>
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                {mission.status === 'planifiee' && (
                  <Button size="small" variant="primary" onClick={() => handleStartMission(mission.id)}>
                    <FaPlay /> Démarrer
                  </Button>
                )}
                {mission.status === 'en_cours' && (
                  <Button size="small" variant="primary" onClick={() => handleCompleteMission(mission.id)}>
                    <FaStop /> Terminer
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal d'ajout */}
      {showAddModal && (
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Nouvelle mission">
          <form onSubmit={(e) => { e.preventDefault(); handleAddMission(); }}>
            <Input label="Titre" value={missionForm.title} onChange={(e) => setMissionForm({...missionForm, title: e.target.value})} required />
            
            <Input label="Description" textarea value={missionForm.description} onChange={(e) => setMissionForm({...missionForm, description: e.target.value})} rows="3" />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Client</label>
                <select value={missionForm.client} onChange={(e) => setMissionForm({...missionForm, client: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px' }} required>
                  <option value="">Sélectionner...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Service</label>
                <select value={missionForm.service} onChange={(e) => setMissionForm({...missionForm, service: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px' }} required>
                  <option value="">Sélectionner...</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Équipe</label>
                <select value={missionForm.team} onChange={(e) => setMissionForm({...missionForm, team: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                  <option value="">Aucune équipe</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Priorité</label>
                <select value={missionForm.priority} onChange={(e) => setMissionForm({...missionForm, priority: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                  <option value="haute">Haute</option>
                  <option value="moyenne">Moyenne</option>
                  <option value="basse">Basse</option>
                </select>
              </div>
            </div>

            <Input label="Lieu" value={missionForm.location} onChange={(e) => setMissionForm({...missionForm, location: e.target.value})} required />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input label="Date début" type="date" value={missionForm.start_date} onChange={(e) => setMissionForm({...missionForm, start_date: e.target.value})} required />
              <Input label="Date fin" type="date" value={missionForm.end_date} onChange={(e) => setMissionForm({...missionForm, end_date: e.target.value})} required />
            </div>

            <Input label="Heures estimées" type="number" min="1" value={missionForm.estimated_hours} onChange={(e) => setMissionForm({...missionForm, estimated_hours: parseInt(e.target.value) || 0})} required />

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Techniciens</label>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
                {technicians.map(tech => (
                  <label key={tech.id} style={{ display: 'block', margin: '0.5rem 0' }}>
                    <input 
                      type="checkbox" 
                      value={tech.id} 
                      checked={missionForm.assigned_to.includes(tech.id)} 
                      onChange={(e) => {
                        const id = tech.id;
                        setMissionForm({
                          ...missionForm,
                          assigned_to: e.target.checked 
                            ? [...missionForm.assigned_to, id]
                            : missionForm.assigned_to.filter(tid => tid !== id)
                        });
                      }}
                      style={{ marginRight: '10px' }}
                    />
                    {tech.username} ({tech.email})
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Annuler</Button>
              <Button type="submit" variant="primary">Créer la mission</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal d'édition */}
      {showEditModal && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Modifier la mission">
          <form onSubmit={(e) => { e.preventDefault(); handleEditMission(); }}>
            <Input label="Titre" value={missionForm.title} onChange={(e) => setMissionForm({...missionForm, title: e.target.value})} required />
            
            <Input label="Description" textarea value={missionForm.description} onChange={(e) => setMissionForm({...missionForm, description: e.target.value})} rows="3" />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Client</label>
                <select value={missionForm.client} onChange={(e) => setMissionForm({...missionForm, client: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px' }} required>
                  <option value="">Sélectionner...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Service</label>
                <select value={missionForm.service} onChange={(e) => setMissionForm({...missionForm, service: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px' }} required>
                  <option value="">Sélectionner...</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Équipe</label>
                <select value={missionForm.team} onChange={(e) => setMissionForm({...missionForm, team: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                  <option value="">Aucune équipe</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Statut</label>
                <select value={missionForm.status} onChange={(e) => setMissionForm({...missionForm, status: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                  <option value="planifiee">Planifiée</option>
                  <option value="en_cours">En cours</option>
                  <option value="terminee">Terminée</option>
                </select>
              </div>
            </div>

            <Input label="Lieu" value={missionForm.location} onChange={(e) => setMissionForm({...missionForm, location: e.target.value})} required />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input label="Date début" type="date" value={missionForm.start_date} onChange={(e) => setMissionForm({...missionForm, start_date: e.target.value})} required />
              <Input label="Date fin" type="date" value={missionForm.end_date} onChange={(e) => setMissionForm({...missionForm, end_date: e.target.value})} required />
            </div>

            <Input label="Heures estimées" type="number" min="1" value={missionForm.estimated_hours} onChange={(e) => setMissionForm({...missionForm, estimated_hours: parseInt(e.target.value) || 0})} required />

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Techniciens</label>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
                {technicians.map(tech => (
                  <label key={tech.id} style={{ display: 'block', margin: '0.5rem 0' }}>
                    <input 
                      type="checkbox" 
                      value={tech.id} 
                      checked={missionForm.assigned_to.includes(tech.id)} 
                      onChange={(e) => {
                        const id = tech.id;
                        setMissionForm({
                          ...missionForm,
                          assigned_to: e.target.checked 
                            ? [...missionForm.assigned_to, id]
                            : missionForm.assigned_to.filter(tid => tid !== id)
                        });
                      }}
                      style={{ marginRight: '10px' }}
                    />
                    {tech.username} ({tech.email})
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>Annuler</Button>
              <Button type="submit" variant="primary">Modifier la mission</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default RealMissionsPage;