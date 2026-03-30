import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import './SuiviMedical.css';

const SuiviMedicalList = () => {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {

    try {

      const res = await fetch('http://localhost:8000/api/suivi-medical/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('ofis_token')}`
        }
      });

      const json = await res.json();

      setData(json);

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }

  };

  const handleDelete = async (id) => {

    if (!window.confirm('Supprimer cet enregistrement ?')) return;

    try {

      await fetch(`http://localhost:8000/api/suivi-medical/${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('ofis_token')}`
        }
      });

      setData(data.filter(item => item.id !== id));

    } catch {

      alert('Erreur suppression');

    }

  };

  const filteredData = data.filter(item =>
    `${item.nom} ${item.prenom} ${item.service}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // calcul jours restants
  const getJoursRestants = (dateExpiration) => {

    const today = new Date();
    const expiration = new Date(dateExpiration);

    const diff = expiration - today;

    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // texte alerte
  const getAlerte = (jours) => {

    if (jours < 0) return "Expiré";

    if (jours <= 30) return "À renouveler";

    return "Valide";

  };

  // classe badge
  const getAlerteClass = (jours) => {

    if (jours < 0) return "alerte-expire";

    if (jours <= 30) return "alerte-renouveler";

    return "";

  };

  // couleur ligne tableau
  const getRowClass = (jours) => {

    if (jours < 0) return "row-expire";

    if (jours <= 30) return "row-renouveler";

    return "row-valide";

  };

  if (loading) return <div>Chargement...</div>;

  return (

    <div className="dashboard-page">

      <div className="page-header">
        <h1>Suivi médical</h1>

        <Link to="/assistante/suivi-medical/nouveau">
          <Button>
            <FaPlus /> Ajouter
          </Button>
        </Link>

      </div>

      <Card>

        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
        />

        <table className="table">

          <thead>
            <tr>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Service</th>
              <th>Délivrance</th>
              <th>Expiration</th>
              <th>Jours restants</th>
              <th>Alerte</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {filteredData.map(item => {

              const jours = getJoursRestants(item.date_expiration);

              return (

                <tr key={item.id} className={getRowClass(jours)}>

                  <td>{item.nom}</td>
                  <td>{item.prenom}</td>
                  <td>{item.service}</td>
                  <td>{item.date_delivrance}</td>
                  <td>{item.date_expiration}</td>
                  <td>{jours}</td>

                  <td>
                    <span className={`alerte-badge ${getAlerteClass(jours)}`}>
                      {getAlerte(jours)}
                    </span>
                  </td>

                  <td>

                    <Link to={`/assistante/suivi-medical/${item.id}`}>
                      <Button size="small">
                        <FaEdit />
                      </Button>
                    </Link>

                    <Button
                      size="small"
                      onClick={()=>handleDelete(item.id)}
                    >
                      <FaTrash />
                    </Button>

                  </td>

                </tr>

              );

            })}

          </tbody>

        </table>

      </Card>

    </div>

  );

};

export default SuiviMedicalList;