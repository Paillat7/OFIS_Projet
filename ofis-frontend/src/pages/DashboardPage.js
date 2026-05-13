import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import { FaFileAlt, FaClock, FaCalendarWeek, FaBuilding, FaUser, FaChartBar, FaChartPie, FaChartLine } from 'react-icons/fa';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
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

  // Données pour le camembert (OT)
  const otData = [
    { name: 'Planifiés', value: stats.ot_counts?.planifie || 0 },
    { name: 'En cours', value: stats.ot_counts?.en_cours || 0 },
    { name: 'À valider', value: stats.ot_counts?.a_valider || 0 },
    { name: 'Validés', value: stats.ot_counts?.valide || 0 },
    { name: 'Rejetés', value: stats.ot_counts?.rejete || 0 },
  ].filter(item => item.value > 0);

  const OT_COLORS = ['#f59e0b', '#10b981', '#f97316', '#3b82f6', '#ef4444'];
  const SOUS_SERVICE_COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f59e0b', '#10b981'];

  const handleCardClick = (path) => {
    if (path) navigate(path);
  };

  return (
    <div className="dashboard-page">
      <h1 className="page-title">Tableau de bord</h1>

      {/* Cartes statistiques */}
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

      {/* Première ligne : graphiques existants */}
      <div className="charts-row">
        <Card className="chart-card">
          <h3><FaChartPie /> Répartition des ordres de travail</h3>
          {otData.length > 0 ? (
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
                  onClick={(data) => {
                    const name = data.name;
                    if (name === 'Planifiés' || name === 'En cours') navigate('/ot-en-cours');
                    else if (name === 'À valider') navigate('/validation-ot');
                    else if (name === 'Validés' || name === 'Rejetés') navigate('/ot-clotures');
                  }}
                >
                  {otData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={OT_COLORS[index % OT_COLORS.length]} style={{ cursor: 'pointer' }} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Aucune donnée</div>
          )}
        </Card>

        <Card className="chart-card">
          <h3><FaChartBar /> Heures travaillées (7 derniers jours)</h3>
          {stats.heures_par_jour && stats.heures_par_jour.length > 0 ? (
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
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Aucune donnée</div>
          )}
        </Card>
      </div>

      {/* Deuxième ligne : Heures par technicien et Répartition par sous-service */}
      <div className="charts-row">
        <Card className="chart-card">
          <h3><FaUser /> Heures par technicien</h3>
          {stats.heures_par_technicien && stats.heures_par_technicien.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.heures_par_technicien} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="nom" width={80} />
                <Tooltip formatter={(value) => `${value} h`} />
                <Legend />
                <Bar dataKey="heures" fill="#8b5cf6" name="Heures" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Aucune donnée</div>
          )}
        </Card>

        <Card className="chart-card">
          <h3><FaChartPie /> Répartition par sous-service</h3>
          {stats.repartition_sous_service && stats.repartition_sous_service.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.repartition_sous_service}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nom, percent }) => `${nom}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="heures"
                >
                  {stats.repartition_sous_service.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SOUS_SERVICE_COLORS[index % SOUS_SERVICE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} h`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Aucune donnée</div>
          )}
        </Card>
      </div>

      {/* Troisième ligne : Évolution mensuelle */}
      <div className="charts-row">
        <Card className="chart-card">
          <h3><FaChartLine /> Évolution mensuelle des heures</h3>
          {stats.evolution_mensuelle && stats.evolution_mensuelle.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.evolution_mensuelle}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} h`} />
                <Legend />
                <Line type="monotone" dataKey="heures" stroke="#f59e0b" name="Heures" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Aucune donnée</div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;


