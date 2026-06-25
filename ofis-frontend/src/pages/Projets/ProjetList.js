import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaEye, FaTrash, FaPlus, FaMoneyBill } from 'react-icons/fa';
import { projetService } from '../../services/projetService';
import { authService } from '../../services/authService';
import api from '../../services/api';

const ProjetList = () => {
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tauxHoraires, setTauxHoraires] = useState({});
  const user = authService.getCurrentUser();
  const isAdminOrManager = user?.role === 'manager' || user?.role === 'admin';
  const isCadre = user?.role === 'cadre';
  const canCreate = isAdminOrManager || isCadre;

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const chargerProjets = async () => {
    setLoading(true);
    try {
      const data = await projetService.getAll();
      if (isMounted.current) {
        setProjets(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      if (isMounted.current) {
        console.error('Erreur chargement projets', error);
        setProjets([]);
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const chargerTauxHoraires = async () => {
    try {
      const data = await api.get('/technicians/');
      const tauxMap = {};
      data.forEach(tech => {
        tauxMap[tech.user_id] = tech.taux_horaire || 0;
      });
      if (isMounted.current) {
        setTauxHoraires(tauxMap);
      }
    } catch (error) {
      if (isMounted.current) {
        console.error('Erreur chargement taux horaires:', error);
      }
    }
  };

  useEffect(() => {
    chargerProjets();
    chargerTauxHoraires();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce projet ?')) {
      try {
        await projetService.delete(id);
        chargerProjets();
      } catch (error) {
        alert('Erreur suppression');
      }
    }
  };

  const getStatutProjet = (projet) => {
    const heuresConsommees = parseFloat(projet.heures_consommees) || 0;
    const estimationHeures = parseFloat(projet.estimation_heures) || 0;
    const estEnDepassementHeures = heuresConsommees > estimationHeures;
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    const dateFinPrevue = projet.date_fin ? new Date(projet.date_fin) : null;
    if (dateFinPrevue) dateFinPrevue.setHours(0, 0, 0, 0);
    const estEnRetardDelai = dateFinPrevue && aujourdhui > dateFinPrevue;
    const estTermine = heuresConsommees >= estimationHeures;
    if (estEnDepassementHeures) {
      return { message: '🔴 Dépassement heures', couleur: '#ef4444', fond: '#fee2e2' };
    }
    if (estEnRetardDelai && !estTermine) {
      return { message: '🔴 Retard (délai)', couleur: '#ef4444', fond: '#fee2e2' };
    }
    if (estTermine) {
      return { message: '✅ Terminé', couleur: '#4caf50', fond: '#e8f5e9' };
    }
    if (projet.statut === 'en_cours') {
      return { message: '🟠 En cours', couleur: '#f59e0b', fond: '#fef3c7' };
    }
    return { message: '🟢 Dans les temps', couleur: '#4caf50', fond: '#e8f5e9' };
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Projets</h1>
        {canCreate && (
          <Link to="/projets/nouveau">
            <Button variant="primary"><FaPlus /> Nouveau projet</Button>
          </Link>
        )}
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {projets.length === 0 ? (
          <Card><p>Aucun projet.</p></Card>
        ) : (
          projets.map(projet => {
            const statut = getStatutProjet(projet);
            const heuresConsommees = parseFloat(projet.heures_consommees) || 0;
            const estimationHeures = parseFloat(projet.estimation_heures) || 0;
            const ecart = heuresConsommees - estimationHeures;
            const isChefProjet = user?.id === projet.chef_projet;
            const canDelete = isAdminOrManager || isChefProjet;
            return (
              <Card key={projet.id} style={{ backgroundColor: statut.fond, borderLeft: `4px solid ${statut.couleur}`, transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0 }}>
                        {projet.nom}
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: statut.couleur }}>
                          {statut.message}
                        </span>
                      </h3>
                    </div>
                    <p><strong>Chef de projet :</strong> {projet.chef_projet_name}</p>
                    <p><strong>Estimation :</strong> {estimationHeures} h</p>
                    <p><strong>Heures consommées :</strong>
                      <span style={{ color: ecart > 0 ? '#ef4444' : '#4caf50', fontWeight: 'bold' }}>
                        {heuresConsommees} h
                      </span>
                    </p>
                    <p><strong>Écart :</strong>
                      <span style={{ color: ecart > 0 ? '#ef4444' : '#4caf50' }}>
                        {ecart > 0 ? `+${ecart} h` : `${ecart} h`}
                      </span>
                    </p>
                    <p><strong>Avancement :</strong> {projet.avancement}%</p>
                    <p><strong>Statut :</strong> {projet.statut === 'en_cours' ? 'En cours' : projet.statut === 'termine' ? 'Terminé' : 'Suspendu'}</p>
                    <p><strong>Date fin prévue :</strong> {projet.date_fin ? new Date(projet.date_fin).toLocaleDateString() : 'Non définie'}</p>
                    {projet.cout_projet && (
                      <p><strong>💰 Coût projet :</strong> {projet.cout_projet.toLocaleString('fr-FR')} {projet.devise_cout || 'XAF'}</p>
                    )}
                    {projet.benefice_attendu && (
                      <p><strong>📈 Bénéfice attendu :</strong> {projet.benefice_attendu.toLocaleString('fr-FR')} {projet.devise_benefice || 'XAF'}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/projets/${projet.id}`}>
                      <Button variant="outline" size="small"><FaEye /> Voir</Button>
                    </Link>
                    {canDelete && (
                      <Button variant="danger" size="small" onClick={() => handleDelete(projet.id)}>
                        <FaTrash />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProjetList;