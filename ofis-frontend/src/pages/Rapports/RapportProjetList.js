import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import projetService from '../../services/projetService';
import { userService } from '../../services/userService';
import api from '../../services/api';
import { FaPlus, FaTrash } from 'react-icons/fa';
import './Projet.css';

const RapportProjetForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [techniciens, setTechniciens] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        date_debut: '',
        date_fin: '',
        service: '',
        observations: '',
        lignes: [] // tableau des interventions
    });

    useEffect(() => {
        chargerDonnees();
        if (id) chargerRapport();
    }, [id]);

    const chargerDonnees = async () => {
        try {
            const users = await userService.getAll();
            // On suppose que les techniciens sont les utilisateurs non-staff
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
            const data = await projetService.getById(id);
            setForm({
                date_debut: data.date_debut || '',
                date_fin: data.date_fin || '',
                service: data.service || '',
                observations: data.observations || '',
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

    // Gestion des lignes
    const handleLigneChange = (index, field, value) => {
        const newLignes = [...form.lignes];
        newLignes[index][field] = value;
        setForm(prev => ({ ...prev, lignes: newLignes }));
    };

    const ajouterLigne = () => {
        setForm(prev => ({
            ...prev,
            lignes: [
                ...prev.lignes,
                {
                    technicien: '',
                    client: '',
                    date_intervention: '',
                    heure_debut: '',
                    heure_fin: '',
                    description: ''
                }
            ]
        }));
    };

    const supprimerLigne = (index) => {
        const newLignes = form.lignes.filter((_, i) => i !== index);
        setForm(prev => ({ ...prev, lignes: newLignes }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (id) {
                await projetService.update(id, form);
            } else {
                await projetService.create(form);
            }
            navigate('/rapports-projet');
        } catch (error) {
            console.error('Erreur sauvegarde', error);
            alert('Erreur: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loading">Chargement...</div>;

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <h1>{id ? 'Modifier' : 'Nouveau'} rapport projet</h1>
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
                        <label>Service</label>
                        <select name="service" value={form.service} onChange={handleChange} required>
                            <option value="">Sélectionner un service</option>
                            <option value="OSN">OSN</option>
                            <option value="OBT">OBT</option>
                        </select>
                    </div>
                    <Input
                        label="Observations"
                        textarea
                        name="observations"
                        value={form.observations}
                        onChange={handleChange}
                        rows="3"
                    />

                    <h3>Interventions</h3>
                    {form.lignes.map((ligne, index) => (
                        <div key={index} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4>Ligne {index + 1}</h4>
                                <Button type="button" variant="outline" size="small" onClick={() => supprimerLigne(index)}>
                                    <FaTrash />
                                </Button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Technicien</label>
                                    <select
                                        value={ligne.technicien}
                                        onChange={(e) => handleLigneChange(index, 'technicien', e.target.value)}
                                        required
                                    >
                                        <option value="">Sélectionner</option>
                                        {techniciens.map(t => (
                                            <option key={t.id} value={t.id}>{t.username}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Client</label>
                                    <select
                                        value={ligne.client}
                                        onChange={(e) => handleLigneChange(index, 'client', e.target.value)}
                                        required
                                    >
                                        <option value="">Sélectionner</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <Input
                                label="Date intervention"
                                type="date"
                                value={ligne.date_intervention}
                                onChange={(e) => handleLigneChange(index, 'date_intervention', e.target.value)}
                                required
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input
                                    label="Heure début"
                                    type="time"
                                    value={ligne.heure_debut}
                                    onChange={(e) => handleLigneChange(index, 'heure_debut', e.target.value)}
                                    required
                                />
                                <Input
                                    label="Heure fin"
                                    type="time"
                                    value={ligne.heure_fin}
                                    onChange={(e) => handleLigneChange(index, 'heure_fin', e.target.value)}
                                    required
                                />
                            </div>
                            <Input
                                label="Description"
                                textarea
                                value={ligne.description}
                                onChange={(e) => handleLigneChange(index, 'description', e.target.value)}
                                rows="2"
                            />
                        </div>
                    ))}
                    <Button type="button" variant="outline" onClick={ajouterLigne}>
                        <FaPlus /> Ajouter une intervention
                    </Button>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                        <Button type="button" variant="outline" onClick={() => navigate('/rapports-projet')}>
                            Annuler
                        </Button>
                        <Button type="submit" variant="primary" disabled={submitting}>
                            {submitting ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default RapportProjetForm;