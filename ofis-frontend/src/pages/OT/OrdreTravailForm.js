import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { otService } from '../../services/otService';
import { userService } from '../../services/userService';
import api from '../../services/api';
import './OT.css';

const OrdreTravailForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [techniciensList, setTechniciensList] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    reference: '',
    objet: '',
    lieu: '',
    duree_estimee: '',
    reference_bc_externe: '',
    technicien: '',
    client_rapport: '',
    statut: 'planifie',
    reference_externe: '',
    code_client: '',
    reference_devis: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    chargerDonnees();
    if (id) chargerOT();
  }, [id]);

  const chargerDonnees = async () => {
    try {
      const usersData = await userService.getAll();
      setTechniciensList(usersData.filter(u => !u.is_staff && !u.is_superuser));
      const clientsData = await api.getClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Erreur chargement données', error);
    }
  };

  const chargerOT = async () => {
    try {
      const data = await otService.getById(id);
      setForm({
        reference: data.reference || '',
        objet: data.objet || '',
        lieu: data.lieu || '',
        duree_estimee: data.duree_estimee || '',
        reference_bc_externe: data.reference_bc_externe || '',
        technicien: data.technicien,
        client_rapport: data.client_rapport || '',
        statut: data.statut,
        reference_externe: data.reference_externe || '',
        code_client: data.code_client || '',
        reference_devis: data.reference_devis || ''
      });
    } catch (error) {
      console.error('Erreur chargement OT', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const dataToSend = {
      reference: form.reference,
      objet: form.objet,
      lieu: form.lieu,
      duree_estimee: form.duree_estimee,
      reference_bc_externe: form.reference_bc_externe,
      technicien: form.technicien,
      client_rapport: form.client_rapport,
      statut: form.statut,
      reference_externe: form.reference_externe,
      code_client: form.code_client,
      reference_devis: form.reference_devis
    };
    try {
      if (id) {
        await otService.update(id, dataToSend);
      } else {
        await otService.create(dataToSend);
      }
      navigate('/ot-en-cours');
    } catch (error) {
      console.error('Erreur sauvegarde', error);
      alert('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>{id ? 'Modifier' : 'Nouvel'} ordre de travail</h1>
      </div>
      <Card>
        <form onSubmit={handleSubmit}>
          <Input
            label="Numéro OT"
            value={form.reference}
            onChange={(e) => setForm({...form, reference: e.target.value})}
            required
          />
          <Input
            label="Objet de l'intervention"
            value={form.objet}
            onChange={(e) => setForm({...form, objet: e.target.value})}
            placeholder="Décrivez brièvement l'objet de l'OT"
            required
          />
          <Input
            label="Lieu"
            value={form.lieu}
            onChange={(e) => setForm({...form, lieu: e.target.value})}
            placeholder="Lieu de l'intervention"
          />
          <Input
            label="Durée estimée (heures)"
            type="number"
            step="0.5"
            name="duree_estimee"
            value={form.duree_estimee}
            onChange={(e) => setForm({...form, duree_estimee: e.target.value})}
            placeholder="Durée prévue pour l'OT"
          />
          <Input
            label="Numéro bon de commande"
            value={form.reference_bc_externe}
            onChange={(e) => setForm({...form, reference_bc_externe: e.target.value})}
          />
          <div className="form-group">
            <label>Technicien</label>
            <select value={form.technicien} onChange={(e) => setForm({...form, technicien: e.target.value})} required>
              <option value="">Sélectionner un technicien</option>
              {techniciensList.map(t => (
                <option key={t.id} value={t.id}>{t.username}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Client</label>
            <select value={form.client_rapport} onChange={(e) => setForm({...form, client_rapport: e.target.value})} required>
              <option value="">Sélectionner un client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} - {c.company}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Statut</label>
            <select value={form.statut} onChange={(e) => setForm({...form, statut: e.target.value})}>
              <option value="planifie">Planifié</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/ot-en-cours')}>
              Annuler
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default OrdreTravailForm;