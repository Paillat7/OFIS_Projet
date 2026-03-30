import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaFileAlt, FaCalendarWeek, FaProjectDiagram, FaShoppingCart, FaHeartbeat } from 'react-icons/fa';
import { rapportService } from '../../services/rapportService';
import { bonService } from '../../services/bonService';
import { suiviMedicalService } from '../../services/suiviMedicalService';
import './Assistante.css';

const AssistanteDashboard = () => {
  const [stats, setStats] = useState({
    journaliers: 0,
    hebdomadaires: 0,
    projets: 0,
    bonsAttente: 0,
    suiviMedical: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerStats();
  }, []);

  const chargerStats = async () => {
    try {
      const [j, h, p, b, s] = await Promise.all([
        rapportService.getJournaliers().catch(() => []),
        rapportService.getHebdomadaires().catch(() => []),
        rapportService.getProjets().catch(() => []),
        bonService.getBons({ statut: 'en_attente' }).catch(() => []),
        suiviMedicalService.getAll().catch(() => [])
      ]);
      setStats({
        journaliers: j.length,
        hebdomadaires: h.length,
        projets: p.length,
        bonsAttente: b.length,
        suiviMedical: s.length
      });
    } catch (error) {
      console.error('Erreur chargement stats', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="assistante-dashboard">
      <h1>Tableau de bord assistante</h1>

      <div className="stats-grid">
        <Card className="stat-card">
          <FaFileAlt className="stat-icon" />
          <div className="stat-content">
            <h3>Rapports journaliers</h3>
            <p className="stat-value">{stats.journaliers}</p>
            <Link to="/assistante/rapports?type=journalier">Voir tous</Link>
          </div>
        </Card>

        <Card className="stat-card">
          <FaCalendarWeek className="stat-icon" />
          <div className="stat-content">
            <h3>Rapports hebdomadaires</h3>
            <p className="stat-value">{stats.hebdomadaires}</p>
            <Link to="/assistante/rapports?type=hebdomadaire">Voir tous</Link>
          </div>
        </Card>

        <Card className="stat-card">
          <FaProjectDiagram className="stat-icon" />
          <div className="stat-content">
            <h3>Rapports de projet</h3>
            <p className="stat-value">{stats.projets}</p>
            <Link to="/assistante/rapports?type=projet">Voir tous</Link>
          </div>
        </Card>

        <Card className="stat-card">
          <FaShoppingCart className="stat-icon" />
          <div className="stat-content">
            <h3>Bons en attente</h3>
            <p className="stat-value">{stats.bonsAttente}</p>
            <Link to="/assistante/bons">Voir tous</Link>
          </div>
        </Card>

        <Card className="stat-card">
          <FaHeartbeat className="stat-icon" />
          <div className="stat-content">
            <h3>Suivi médical</h3>
            <p className="stat-value">{stats.suiviMedical}</p>
            <Link to="/assistante/suivi-medical">Voir tous</Link>
          </div>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card className="quick-actions">
        <h2>Actions rapides</h2>
        <div className="actions-grid">
          <Link to="/rapports/journalier/nouveau">
            <Button variant="primary">Nouveau rapport journalier</Button>
          </Link>
          <Link to="/rapports/hebdomadaire/nouveau">
            <Button variant="primary">Nouveau rapport hebdomadaire</Button>
          </Link>
          <Link to="/rapports/projet/nouveau">
            <Button variant="primary">Nouveau rapport de projet</Button>
          </Link>
          <Link to="/bons/nouveau">
            <Button variant="primary">Nouveau bon de commande</Button>
          </Link>
          <Link to="/assistante/suivi-medical/nouveau">
            <Button variant="primary">Nouveau suivi médical</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default AssistanteDashboard;