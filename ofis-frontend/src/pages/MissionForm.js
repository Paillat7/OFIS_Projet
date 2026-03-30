import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { teamService } from '../services/TeamService';
import { userService } from '../services/userService';
import api from '../services/api';

const MissionForm = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [teams, setTeams] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    client: '',
    service: '',
    team: '',
    assigned_to: [],
    priority: 'moyenne',
    location: '',
    start_date: '',
    end_date: '',
    estimated_hours: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const servicesData = await teamService.getServices();
      setServices(servicesData);
      const teamsData = await teamService.getTeams();
      setTeams(teamsData);
      const clientsData = await api.getClients();
      setClients(clientsData);
      const users = await userService.getAll();
      // Filtrer pour n'avoir que les techniciens (non staff, non superuser)
      const techs = users.filter(u => !u.is_staff && !u.is_superuser);
      setTechnicians(techs);
    } catch (error) {
      console.error('Erreur chargement données formulaire mission:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await teamService.createMission(form);
      navigate('/missions');
    } catch (error) {
      alert('Erreur création');
    }
  };

  const handleCheckboxChange = (techId) => {
    setForm(prev => ({
      ...prev,
      assigned_to: prev.assigned_to.includes(techId)
        ? prev.assigned_to.filter(id => id !== techId)
        : [...prev.assigned_to, techId]
    }));
  };

  return (
    <div className="dashboard-page">
      <h1>Nouvelle mission</h1>
      <Card>
        <form onSubmit={handleSubmit}>
          <Input
            label="Titre"
            value={form.title}
            onChange={(e) => setForm({...form, title: e.target.value})}
            required
          />
          <Input
            label="Description"
            textarea
            value={form.description}
            onChange={(e) => setForm({...form, description: e.target.value})}
            rows="3"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Client</label>
              <select
                value={form.client}
                onChange={(e) => setForm({...form, client: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                required
              >
                <option value="">Sélectionner...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Service</label>
              <select
                value={form.service}
                onChange={(e) => setForm({...form, service: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                required
              >
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
              <select
                value={form.team}
                onChange={(e) => setForm({...form, team: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px' }}
              >
                <option value="">Aucune équipe</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Priorité</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({...form, priority: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px' }}
              >
                <option value="haute">Haute</option>
                <option value="moyenne">Moyenne</option>
                <option value="basse">Basse</option>
              </select>
            </div>
          </div>

          <Input
            label="Lieu"
            value={form.location}
            onChange={(e) => setForm({...form, location: e.target.value})}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Date début"
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({...form, start_date: e.target.value})}
              required
            />
            <Input
              label="Date fin"
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({...form, end_date: e.target.value})}
              required
            />
          </div>

          <Input
            label="Heures estimées"
            type="number"
            min="1"
            value={form.estimated_hours}
            onChange={(e) => setForm({...form, estimated_hours: parseInt(e.target.value) || 0})}
            required
          />

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Techniciens</label>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
              {technicians.length === 0 ? (
                <p style={{ color: '#999', fontStyle: 'italic' }}>Aucun technicien disponible</p>
              ) : (
                technicians.map(tech => (
                  <label key={tech.id} style={{ display: 'block', margin: '0.5rem 0' }}>
                    <input
                      type="checkbox"
                      checked={form.assigned_to.includes(tech.id)}
                      onChange={() => handleCheckboxChange(tech.id)}
                      style={{ marginRight: '10px' }}
                    />
                    {tech.username} ({tech.email || 'pas d\'email'})
                  </label>
                ))
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Button type="button" variant="outline" onClick={() => navigate('/missions')}>Annuler</Button>
            <Button type="submit" variant="primary">Créer la mission</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default MissionForm;