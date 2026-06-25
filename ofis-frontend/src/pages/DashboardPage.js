import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import {
  FaFileAlt, FaClock, FaCalendarWeek, FaBuilding, FaUser,
  FaChartBar, FaChartPie, FaChartLine, FaTasks, FaExclamationTriangle
} from 'react-icons/fa';
import api from '../services/api';
import { authService } from '../services/authService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import './Dashboard.css';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const role = user?.role;

  const isAdminOrManager = role === 'admin' || role === 'manager';
  const isCadre = role === 'cadre';
  const isTechnicien = role === 'technicien';

  const isMounted = useRef(true);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(true);
    abortControllerRef.current = new AbortController();
    try {
      const data = await api.getDashboardStats({ signal: abortControllerRef.current.signal });
      if (isMounted.current) {
        setStats(data);
        setError(null);
      }
    } catch (err) {
      if (isMounted.current && err.name !== 'AbortError') {
        console.error('Erreur chargement stats', err);
        setError('Impossible de charger les statistiques');
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) return <div className="loading">Chargement du tableau de bord...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!stats) return null;

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

  const showHebdo = isAdminOrManager || isCadre;
  const showClients = isAdminOrManager || isCadre;
  const showHeuresParTechnicien = true;
  const showSousService = true;

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
        {showHebdo && (
          <Card className="stat-card" onClick={() => handleCardClick('/rapports-hebdo-cadre')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon"><FaCalendarWeek /></div>
            <div className="stat-content">
              <h3>Rapports hebdomadaires</h3>
              <p className="stat-value">{stats.total_rapports_hebdo || 0}</p>
            </div>
          </Card>
        )}
        {showClients && (
          <Card className="stat-card" onClick={() => handleCardClick('/clients')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon"><FaBuilding /></div>
            <div className="stat-content">
              <h3>Clients</h3>
              <p className="stat-value">{stats.total_clients}</p>
            </div>
          </Card>
        )}
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <Card
          className="stat-card"
          style={{
            borderLeft: `4px solid ${(stats.ot_kpi?.en_retard || 0) > 0 ? '#ef4444' :
              (stats.ot_kpi?.en_cours || 0) > 0 ? '#f59e0b' : '#4caf50'
            }`,
            cursor: 'pointer',
            gridColumn: '1 / -1'
          }}
          onClick={() => navigate('/ot-en-cours')}
        >
          <div className="stat-icon"><FaTasks /></div>
          <div className="stat-content">
            <h3>Ordres de travail</h3>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
              <span style={{ background: '#e8f5e9', padding: '0.25rem 0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                🟢 <strong>{stats.ot_kpi?.dans_les_temps || 0}</strong> Dans les Temps
              </span>
              <span style={{ background: '#fff3e0', padding: '0.25rem 0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                🟠 <strong>{stats.ot_kpi?.en_cours || 0}</strong> En cours
              </span>
              <span style={{ background: '#fee2e2', padding: '0.25rem 0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                🔴 <strong>{stats.ot_kpi?.en_retard || 0}</strong> En retard
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
              Total: {stats.ot_kpi?.total || 0} OT
            </p>
          </div>
        </Card>
      </div>

      {stats.ots_retard && stats.ots_retard.length > 0 && (
        <Card className="stat-card" style={{ borderLeft: '4px solid #ef4444', marginBottom: '1.5rem', backgroundColor: '#fef2f2', gridColumn: '1 / -1' }}>
          <h3 style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaExclamationTriangle /> OT en retard ({stats.ots_retard.length})
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #fecaca' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>OT</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Objet</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Client</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Retard</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Techniciens</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.ots_retard.map(ot => (
                  <tr key={ot.id} style={{ borderBottom: '1px solid #fee2e2' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 500 }}>{ot.reference}</td>
                    <td style={{ padding: '0.5rem' }}>{ot.objet}</td>
                    <td style={{ padding: '0.5rem' }}>{ot.client}</td>
                    <td style={{ padding: '0.5rem', color: '#dc2626', fontWeight: 'bold' }}>
                      +{ot.jours_retard} jour{ot.jours_retard > 1 ? 's' : ''}
                    </td>
                    <td style={{ padding: '0.5rem' }}>{ot.techniciens?.join(', ') || '-'}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <button
                        onClick={() => navigate(`/ordres-travail/${ot.id}`)}
                        style={{ padding: '0.25rem 0.75rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Voir l'OT
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="charts-row">
        <Card className="chart-card">
          <h3><FaChartPie /> Répartition des ordres de travail</h3>
          {otData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart isAnimationActive={false}>
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
              <BarChart data={stats.heures_par_jour} isAnimationActive={false}>
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

      <div className="charts-row">
        {showHeuresParTechnicien && (
          <Card className="chart-card">
            <h3><FaUser /> Heures par technicien</h3>
            {stats.heures_par_technicien && stats.heures_par_technicien.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.heures_par_technicien} layout="vertical" isAnimationActive={false}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="nom" width={80} />
                  <Tooltip formatter={(value) => `${value} h`} />
                  <Legend />
                  <Bar dataKey="heures" fill="#8b5cf6" name="Heures" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Aucune donnée pour votre sous-service</div>
            )}
          </Card>
        )}

        {showSousService && (
          <Card className="chart-card">
            <h3><FaChartPie /> Répartition par sous-service</h3>
            {stats.repartition_sous_service && stats.repartition_sous_service.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart isAnimationActive={false}>
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
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Aucune donnée pour votre sous-service</div>
            )}
          </Card>
        )}
      </div>

      <div className="charts-row">
        <Card className="chart-card">
          <h3><FaChartLine /> Évolution mensuelle des heures</h3>
          {stats.evolution_mensuelle && stats.evolution_mensuelle.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.evolution_mensuelle} isAnimationActive={false}>
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