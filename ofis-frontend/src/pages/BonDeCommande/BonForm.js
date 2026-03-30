import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { bonService } from '../../services/bonService';
import api from '../../services/api';
import './BonDeCommande.css';

const BonForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    client: '',
    montant_ht: '',
    tva: 0,
    devise: 'EUR',
    statut: 'en_attente'
  });

  const devises = [
    { code: 'EUR', label: 'Euro (€)' },
    { code: 'USD', label: 'Dollar US ($)' },
    { code: 'GBP', label: 'Livre Sterling (£)' },
    { code: 'XAF', label: 'XAF (BEAC)' },
    { code: 'XOF', label: 'XOF(BCEAO)' },
    { code: 'MAD', label: 'Dirham marocain' },
    { code: 'DZD', label: 'Dinar algérien' },
    { code: 'TND', label: 'Dinar tunisien' },
  ];

  useEffect(() => {
    chargerClients();
    if (id) chargerBon();
  }, [id]);

  const chargerClients = async () => {
    try {
      const data = await api.getClients();
      setClients(data);
    } catch (error) {
      console.error(error);
    }
  };

  const chargerBon = async () => {
    try {
      const data = await bonService.getBon(id);
      setForm({
        client: data.client?.id || data.client || '',
        montant_ht: data.montant_ht,
        tva: data.tva,
        devise: data.devise,
        statut: data.statut
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dataToSend = {
      client: form.client,
      montant_ht: parseFloat(form.montant_ht.toString().replace(',', '.')),
      tva: parseFloat(form.tva.toString().replace(',', '.')),
      devise: form.devise,
      statut: form.statut
    };

    try {
      if (id) {
        await bonService.updateBon(id, dataToSend); // ← corrigé : updateBon
      } else {
        await bonService.createBon(dataToSend); // ← corrigé : createBon
      }
      navigate('/bons');
    } catch (error) {
      console.error('Erreur détaillée:', error);
      alert(`Erreur : ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>{id ? 'Modifier' : 'Nouveau'} bon de commande</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Client</label>
            <select
              value={form.client}
              onChange={(e) => setForm({...form, client: e.target.value})}
              required
            >
              <option value="">Sélectionner un client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} - {c.company}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Montant HT"
            type="number"
            step="0.01"
            value={form.montant_ht}
            onChange={(e) => setForm({...form, montant_ht: e.target.value})}
            required
          />

          <Input
            label="TVA (%)"
            type="number"
            step="0.1"
            value={form.tva}
            onChange={(e) => setForm({...form, tva: e.target.value})}
          />

          <div className="form-group">
            <label>Devise</label>
            <select
              value={form.devise}
              onChange={(e) => setForm({...form, devise: e.target.value})}
            >
              {devises.map(d => (
                <option key={d.code} value={d.code}>{d.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Statut</label>
            <select
              value={form.statut}
              onChange={(e) => setForm({...form, statut: e.target.value})}
            >
              <option value="en_attente">En attente</option>
              <option value="valide">Validé</option>
              <option value="paye">Payé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/bons')}>
              Annuler
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default BonForm;