import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaEye, FaEdit, FaTrash, FaEnvelope, FaCheck } from 'react-icons/fa';
import { rapportService } from '../../services/rapportService';
import './Assistante.css';

const AssistanteRapports = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialType = queryParams.get('type') || 'journalier';

  const [activeTab, setActiveTab] = useState(initialType);
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    chargerRapports();
  }, [activeTab]);

  const chargerRapports = async () => {
    setLoading(true);
    try {
      let data = [];
      if (activeTab === 'journalier') {
        data = await rapportService.getJournaliers();
      } else if (activeTab === 'hebdomadaire') {
        data = await rapportService.getHebdomadaires();
      } else if (activeTab === 'projet') {
        data = await rapportService.getProjets();
      }
      setRapports(data);
    } catch (error) {
      console.error('Erreur chargement rapports', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce rapport ?')) return;
    try {
      if (activeTab === 'journalier') {
        await rapportService.deleteJournalier(id);
      } else if (activeTab === 'hebdomadaire') {
        await rapportService.deleteHebdomadaire(id);
      } else if (activeTab === 'projet') {
        await rapportService.deleteProjet(id);
      }
      chargerRapports();
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const handleEnvoyerEmail = (id) => {
    alert(`Envoi du rapport ${id} par email (simulation)`);
  };

  const handleValider = (id) => {
    alert(`Validation du rapport ${id} (simulation)`);
  };

  const getEditLink = (id) => {
    if (activeTab === 'journalier') return `/rapports/journalier/modifier/${id}`;
    if (activeTab === 'hebdomadaire') return `/rapports/hebdomadaire/modifier/${id}`;
    if (activeTab === 'projet') return `/rapports/projet/modifier/${id}`;
    return '#';
  };

  const getViewLink = (id) => {
    // On utilise le même lien que l'édition pour voir/modifier
    if (activeTab === 'journalier') return `/rapports/journalier/modifier/${id}`;
    if (activeTab === 'hebdomadaire') return `/rapports/hebdomadaire/modifier/${id}`;
    if (activeTab === 'projet') return `/rapports/projet/modifier/${id}`;
    return '#';
  };

  const renderTable = () => {
    if (activeTab === 'journalier') {
      return (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Mission</th>
              <th>Technicien</th>
              <th>Client</th>
              <th>RIT</th>
              <th>PV</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rapports.map(r => (
              <tr key={r.id}>
                <td>{new Date(r.date).toLocaleDateString()}</td>
                <td>{r.mission_title}</td>
                <td>{r.technicien_name}</td>
                <td>{r.client_name}</td>
                <td>{r.rit_signe ? '✅' : '❌'}</td>
                <td>{r.pv_signe ? '✅' : '❌'}</td>
                <td>
                  <Link to={getViewLink(r.id)}><Button size="small" variant="outline"><FaEye /></Button></Link>
                  <Link to={getEditLink(r.id)}><Button size="small" variant="outline"><FaEdit /></Button></Link>
                  <Button size="small" variant="outline" onClick={() => handleDelete(r.id)}><FaTrash /></Button>
                  <Button size="small" variant="outline" onClick={() => handleEnvoyerEmail(r.id)}><FaEnvelope /></Button>
                  <Button size="small" variant="outline" onClick={() => handleValider(r.id)}><FaCheck /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (activeTab === 'hebdomadaire') {
      return (
        <table className="table">
          <thead>
            <tr>
              <th>Période</th>
              <th>Cadre</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rapports.map(r => (
              <tr key={r.id}>
                <td>{new Date(r.date_debut).toLocaleDateString()} - {new Date(r.date_fin).toLocaleDateString()}</td>
                <td>{r.cadre_name}</td>
                <td>
                  <Link to={getViewLink(r.id)}><Button size="small" variant="outline"><FaEye /></Button></Link>
                  <Link to={getEditLink(r.id)}><Button size="small" variant="outline"><FaEdit /></Button></Link>
                  <Button size="small" variant="outline" onClick={() => handleDelete(r.id)}><FaTrash /></Button>
                  <Button size="small" variant="outline" onClick={() => handleEnvoyerEmail(r.id)}><FaEnvelope /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (activeTab === 'projet') {
      return (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Projet</th>
              <th>Ingénieur</th>
              <th>Avancement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rapports.map(r => (
              <tr key={r.id}>
                <td>{new Date(r.date).toLocaleDateString()}</td>
                <td>{r.projet}</td>
                <td>{r.ingenieur_name}</td>
                <td>{r.avancement}%</td>
                <td>
                  <Link to={getViewLink(r.id)}><Button size="small" variant="outline"><FaEye /></Button></Link>
                  <Link to={getEditLink(r.id)}><Button size="small" variant="outline"><FaEdit /></Button></Link>
                  <Button size="small" variant="outline" onClick={() => handleDelete(r.id)}><FaTrash /></Button>
                  <Button size="small" variant="outline" onClick={() => handleEnvoyerEmail(r.id)}><FaEnvelope /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  };

  return (
    <div className="assistante-page">
      <div className="page-header">
        <h1>Gestion des rapports</h1>
        <Link to={`/rapports/${activeTab}/nouveau`}>
          <Button variant="primary">Nouveau rapport {activeTab}</Button>
        </Link>
      </div>

      <div className="tabs">
        <button className={activeTab === 'journalier' ? 'active' : ''} onClick={() => setActiveTab('journalier')}>Journaliers</button>
        <button className={activeTab === 'hebdomadaire' ? 'active' : ''} onClick={() => setActiveTab('hebdomadaire')}>Hebdomadaires</button>
        <button className={activeTab === 'projet' ? 'active' : ''} onClick={() => setActiveTab('projet')}>Projets</button>
      </div>

      <Card>
        {loading ? <p>Chargement...</p> : renderTable()}
      </Card>
    </div>
  );
};

export default AssistanteRapports;