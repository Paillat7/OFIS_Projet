import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { rapportService } from '../../services/rapportService';
import { authService } from '../../services/authService';
import api from '../../services/api';
import { FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';
import './Rapports.css';

const RapportHebdoCadreForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [loading, setLoading] = useState(false);
    const [techniciens, setTechniciens] = useState([]);
    const [clients, setClients] = useState([]);
    const [form, setForm] = useState({
        date_debut: '',
        date_fin: '',
        type: 'maintenances',
        lignes: []
    });

    useEffect(() => {
        chargerDonnees();
        if (id) chargerRapport();
    }, [id]);

    const chargerDonnees = async () => {
        try {
            const users = await api.getUsers();
            setTechniciens(users.filter(u => !u.is_staff && !u.is_superuser));
            const clientsData = await api.getClients();
            setClients(clientsData);
        } catch (error) {
            console.error('Erreur chargement données', error);
        }
    };

    const chargerRapport = async () => {
        setLoading(true);
        try {
            const data = await rapportService.getHebdoCadre(id);
            setForm({
                date_debut: data.date_debut,
                date_fin: data.date_fin,
                type: data.type,
                lignes: data.lignes || []
            });
        } catch (error) {
            console.error('Erreur chargement rapport', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleLigneChange = (idx, field, value) => {
        const newLignes = [...form.lignes];
        newLignes[idx][field] = value;
        setForm(prev => ({ ...prev, lignes: newLignes }));
    };

    const ajouterLigne = () => {
        setForm(prev => ({
            ...prev,
            lignes: [
                ...prev.lignes,
                {
                    client: '',
                    nature_intervention: '',
                    avancement_resultat: '',
                    date_debut: '',
                    date_fin: '',
                    numero_ticket: '',
                    intervenant: ''
                }
            ]
        }));
    };

    const supprimerLigne = (idx) => {
        const newLignes = [...form.lignes];
        newLignes.splice(idx, 1);
        setForm(prev => ({ ...prev, lignes: newLignes }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (id) {
                await rapportService.updateHebdoCadre(id, form);
            } else {
                await rapportService.createHebdoCadre(form);
            }
            navigate('/rapports-hebdo-cadre');
        } catch (error) {
            console.error('Erreur sauvegarde', error);
            alert('Erreur : ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <Button variant="outline" onClick={() => navigate(-1)}>
                    <FaArrowLeft /> Retour
                </Button>
                <h1>{id ? 'Modifier' : 'Nouveau'} rapport hebdomadaire</h1>
            </div>
            <Card>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label="Date début"
                            type="date"
                            name="date_debut"
                            value={form.date_debut}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Date fin"
                            type="date"
                            name="date_fin"
                            value={form.date_fin}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Type de rapport</label>
                        <select name="type" value={form.type} onChange={handleChange} required>
                            <option value="av">Avant-Vente</option>
                            <option value="projets">Projets</option>
                            <option value="maintenances">Maintenances / Interventions</option>
                            <option value="autres">Autres</option>
                        </select>
                    </div>

                    <h3>Détail des interventions</h3>
                    {form.lignes.map((ligne, idx) => (
                        <div key={idx} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' }}>
                            <div className="form-group">
                                <label>Client</label>
                                <select
                                    value={ligne.client}
                                    onChange={(e) => handleLigneChange(idx, 'client', e.target.value)}
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
                                label="Nature de l'intervention"
                                value={ligne.nature_intervention}
                                onChange={(e) => handleLigneChange(idx, 'nature_intervention', e.target.value)}
                                required
                            />
                            <Input
                                label="Avancement / Résultat"
                                textarea
                                value={ligne.avancement_resultat}
                                onChange={(e) => handleLigneChange(idx, 'avancement_resultat', e.target.value)}
                                rows="2"
                                required
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input
                                    label="Début"
                                    type="date"
                                    value={ligne.date_debut}
                                    onChange={(e) => handleLigneChange(idx, 'date_debut', e.target.value)}
                                    required
                                />
                                <Input
                                    label="Fin"
                                    type="date"
                                    value={ligne.date_fin}
                                    onChange={(e) => handleLigneChange(idx, 'date_fin', e.target.value)}
                                    required
                                />
                            </div>
                            <Input
                                label="N° Ticket"
                                value={ligne.numero_ticket}
                                onChange={(e) => handleLigneChange(idx, 'numero_ticket', e.target.value)}
                            />
                            <div className="form-group">
                                <label>Intervenant</label>
                                <select
                                    value={ligne.intervenant}
                                    onChange={(e) => handleLigneChange(idx, 'intervenant', e.target.value)}
                                    required
                                >
                                    <option value="">Sélectionner un technicien</option>
                                    {techniciens.map(t => (
                                        <option key={t.id} value={t.id}>{t.username}</option>
                                    ))}
                                </select>
                            </div>
                            <Button variant="outline" size="small" onClick={() => supprimerLigne(idx)}>
                                <FaTrash /> Supprimer
                            </Button>
                        </div>
                    ))}
                    <Button variant="outline" onClick={ajouterLigne}>
                        <FaPlus /> Ajouter une intervention
                    </Button>

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                            Annuler
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default RapportHebdoCadreForm;