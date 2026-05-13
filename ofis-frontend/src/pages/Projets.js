// src/pages/Projets.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import FilterBar from '../components/common/FilterBar';
import { projetService } from '../services/projetService';
import { userService } from '../services/userService';
import { FaPlus, FaEye, FaEdit, FaTrash, FaUsers, FaClock } from 'react-icons/fa';

const Projets = () => {
  const navigate = useNavigate();
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ field: 'date_debut', order: 'desc' });
  const user = JSON.parse(localStorage.getItem('ofis_user') || '{}');

  // Charger les utilisateurs pour les filtres (admin seulement)
  useEffect(() => {
    const fetchUsers = async () => {
      if (user.role === 'admin' || user.role === 'manager') {
        try {
          const data = await userService.getAll();
          setUsers(data);
        } catch (error) {
          console.error('Erreur chargement utilisateurs', error);
        }
      }
    };
    fetchUsers();
  }, [user.role]);

  // Charger les projets avec filtres
  useEffect(() => {
    fetchProjets();
  }, [filters, search, sort]);

  const fetchProjets = async () => {
    setLoading(true);
    try {
      const params = { ...filters, search, ordering: `${sort.order === 'desc' ? '-' : ''}${sort.field}` };
      const data = await projetService.getAll(params);
      setProjets(data);
    } catch (error) {
      console.error('Erreur chargement projets', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSearch = (term) => {
    setSearch(term);
  };

  const handleSort = (field, order) => {
    setSort({ field, order });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce projet ?')) {
      try {
        await projetService.delete(id);
        fetchProjets();
      } catch (error) {
        console.error('Erreur suppression', error);
      }
    }
  };

  // Configuration des filtres
  const getFilters = () => {
    const filterList = [
      {
        name: 'statut',
        label: 'Statut',
        type: 'select',
        options: [
          { value: 'en_cours', label: 'En cours' },
          { value: 'termine', label: 'Terminé' },
          { value: 'suspendu', label: 'Suspendu' }
        ]
      }
    ];

    if (user.role === 'admin' || user.role === 'manager') {
      filterList.push({
        name: 'chef_projet',
        label: 'Chef de projet',
        type: 'select',
        options: users.filter(u => u.role === 'cadre' || u.is_staff).map(u => ({ value: u.id, label: u.username }))
      });
      filterList.push({
        name: 'intervenant',
        label: 'Intervenant',
        type: 'select',
        options: users.map(u => ({ value: u.id, label: u.username }))
      });
    }

    return filterList;
  };

  const getStatutBadge = (statut) => {
    const config = {
      en_cours: { label: 'En cours', color: '#2196F3', bg: '#E3F2FD' },
      termine: { label: 'Terminé', color: '#4CAF50', bg: '#E8F5E9' },
      suspendu: { label: 'Suspendu', color: '#FF9800', bg: '#FFF3E0' }
    };
    const c = config[statut] || { label: statut, color: '#666', bg: '#f0f0f0' };
    return (
      <span style={{ 
        background: c.bg, 
        color: c.color, 
        padding: '0.25rem 0.75rem', 
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: 500
      }}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="projets-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Projets</h1>
        {(user.role === 'admin' || user.role === 'manager') && (
          <Button variant="primary" onClick={() => navigate('/projets/nouveau')} icon={<FaPlus />}>
            Nouveau projet
          </Button>
        )}
      </div>

      <FilterBar
        filters={getFilters()}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onSort={handleSort}
        sortField={sort.field}
        sortOrder={sort.order}
        showDateRange={true}
        loading={loading}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Chargement...</div>
      ) : projets.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Aucun projet trouvé
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {projets.map(projet => (
            <Card key={projet.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0 }}>{projet.nom}</h3>
                    {getStatutBadge(projet.statut)}
                  </div>
                  <p style={{ color: '#666', marginBottom: '0.5rem' }}>{projet.description}</p>
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.875rem', color: '#666' }}>
                    <span><strong>Chef :</strong> {projet.chef_projet_name}</span>
                    <span><strong>Estimation :</strong> {projet.estimation_heures} h</span>
                    <span><strong>Consommé :</strong> {projet.heures_consommees} h</span>
                    <span><strong>Reste :</strong> {projet.heures_restantes} h</span>
                    <span><strong>Avancement :</strong> {projet.avancement}%</span>
                    <span><strong>Début :</strong> {projet.date_debut}</span>
                    {projet.date_fin && <span><strong>Fin :</strong> {projet.date_fin}</span>}
                  </div>
                  {projet.intervenants_names && projet.intervenants_names.length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <FaUsers style={{ color: '#666' }} />
                      {projet.intervenants_names.map(name => (
                        <span key={name} style={{ background: '#f0f0f0', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: '0.75rem', background: '#f0f0f0', borderRadius: '4px', height: '8px', width: '100%', maxWidth: '300px' }}>
                    <div style={{ background: '#4CAF50', borderRadius: '4px', height: '8px', width: `${projet.avancement}%` }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/projets/${projet.id}`)} icon={<FaEye />} />
                  {(user.role === 'admin' || user.role === 'manager' || user.id === projet.chef_projet) && (
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/projets/${projet.id}/modifier`)} icon={<FaEdit />} />
                  )}
                  {(user.role === 'admin' || user.role === 'manager') && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(projet.id)} icon={<FaTrash />} style={{ color: '#dc3545' }} />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projets;

