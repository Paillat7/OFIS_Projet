import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import { FaFileAlt, FaClock, FaCalendarWeek, FaBuilding } from 'react-icons/fa';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Dashboard.css';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement stats', err);
      setError('Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Chargement du tableau de bord...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!stats) return null;

  // Données pour le camembert (OT) avec la catégorie "À valider"
  const otData = [
    { name: 'Planifiés', value: stats.ot_counts?.planifie || 0 },
    { name: 'En cours', value: stats.ot_counts?.en_cours || 0 },
    { name: 'À valider', value: stats.ot_counts?.a_valider || 0 },
    { name: 'Validés', value: stats.ot_counts?.valide || 0 },
    { name: 'Rejetés', value: stats.ot_counts?.rejete || 0 },
  ].filter(item => item.value > 0);

  const COLORS = ['#f59e0b', '#10b981', '#f97316', '#3b82f6', '#ef4444'];

  const handleCardClick = (path) => {
    if (path) navigate(path);
  };

  return (
    <div className="dashboard-page">
      <h1 className="page-title">Tableau de bord</h1>

      <div className="stats-grid">
        <Card className="stat-card" onClick={() => handleCardClick('/ot-en-cours')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><FaClock /></div>
          <div className="stat-content">
            <h3>Heures travaillées</h3>
            <p className="stat-value">{stats.total_heures?.toFixed(1) || 0} h</p>
          </div>
        </Card>
        <Card className="stat-card" onClick={() => handleCardClick('/rapports/journalier')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><FaFileAlt /></div>
          <div className="stat-content">
            <h3>Rapports journaliers</h3>
            <p className="stat-value">{stats.total_rapports_journaliers || 0}</p>
          </div>
        </Card>
        <Card className="stat-card" onClick={() => handleCardClick('/rapports-hebdo-cadre')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><FaCalendarWeek /></div>
          <div className="stat-content">
            <h3>Rapports hebdomadaires</h3>
            <p className="stat-value">{stats.total_rapports_hebdo || 0}</p>
          </div>
        </Card>
        {stats.total_clients !== undefined && (
          <Card className="stat-card" onClick={() => handleCardClick('/clients')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon"><FaBuilding /></div>
            <div className="stat-content">
              <h3>Clients</h3>
              <p className="stat-value">{stats.total_clients}</p>
            </div>
          </Card>
        )}
      </div>

      <div className="charts-row">
        <Card className="chart-card">
          <h3>Répartition des ordres de travail</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={otData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                onClick={(data, index) => {
                  const name = data.name;
                  if (name === 'Planifiés' || name === 'En cours') navigate('/ot-en-cours');
                  else if (name === 'À valider') navigate('/validation-ot');
                  else if (name === 'Validés') navigate('/ot-clotures');
                  else if (name === 'Rejetés') navigate('/ot-clotures');
                }}
              >
                {otData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ cursor: 'pointer' }} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="chart-card">
          <h3>Heures travaillées (7 derniers jours)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.heures_par_jour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="heures"
                fill="#3b82f6"
                name="Heures"
                onClick={(data) => {
                  if (data && data.payload && data.payload.date) {
                    navigate(`/rapports/journalier?date=${data.payload.date}`);
                  }
                }}
                style={{ cursor: 'pointer' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;