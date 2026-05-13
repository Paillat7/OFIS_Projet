import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { rapportService } from '../../services/rapportService';
import { authService } from '../../services/authService';
import { FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';

const RapportHebdoCadreForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [loading, setLoading] = useState(false);
    
    // État pour les tickets
    const [tickets, setTickets] = useState([
        { client: '', numero: '', nature: '', intervenant: '' }
    ]);
    
    const [form, setForm] = useState({
        date_debut: '',
        date_fin: '',
        type: 'maintenances',
        resume: '',
        actions_notables: '',
        difficultes: '',
        perspectives: '',
        nb_interventions: 0,
        heures_total: 0
    });

    useEffect(() => {
        if (id) chargerRapport();
    }, [id]);

    const chargerRapport = async () => {
        setLoading(true);
        try {
            const data = await rapportService.getHebdoCadre(id);
            setForm({
                date_debut: data.date_debut || '',
                date_fin: data.date_fin || '',
                type: data.type || 'maintenances',
                resume: data.resume || '',
                actions_notables: data.actions_notables || '',
                difficultes: data.difficultes || '',
                perspectives: data.perspectives || '',
                nb_interventions: data.nb_interventions || 0,
                heures_total: data.heures_total || 0
            });
            
            // Charger les tickets existants
            if (data.tickets && data.tickets.length > 0) {
                setTickets(data.tickets);
            }
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

    // Gestion des tickets
    const handleTicketChange = (index, field, value) => {
        const newTickets = [...tickets];
        newTickets[index][field] = value;
        setTickets(newTickets);
    };

    const ajouterTicket = () => {
        setTickets([...tickets, { client: '', numero: '', nature: '', intervenant: '' }]);
    };

    const supprimerTicket = (index) => {
        if (tickets.length > 1) {
            const newTickets = tickets.filter((_, i) => i !== index);
            setTickets(newTickets);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const dataToSend = {
                date_debut: form.date_debut,
                date_fin: form.date_fin,
                type: form.type,
                resume: form.resume,
                actions_notables: form.actions_notables,
                difficultes: form.difficultes,
                perspectives: form.perspectives,
                nb_interventions: parseInt(form.nb_interventions) || 0,
                heures_total: parseFloat(form.heures_total) || 0,
                tickets: tickets.filter(t => t.numero && t.client) // Garder seulement les tickets remplis
            };
            
            if (id) {
                await rapportService.updateHebdoCadre(id, dataToSend);
            } else {
                await rapportService.createHebdoCadre(dataToSend);
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

                    <Input
                        label="Résumé de la semaine"
                        name="resume"
                        textarea
                        value={form.resume}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Résumé des activités de la semaine..."
                    />

                    <Input
                        label="Actions notables"
                        name="actions_notables"
                        textarea
                        value={form.actions_notables}
                        onChange={handleChange}
                        rows="2"
                        placeholder="Actions notables réalisées..."
                    />

                    <Input
                        label="Difficultés rencontrées"
                        name="difficultes"
                        textarea
                        value={form.difficultes}
                        onChange={handleChange}
                        rows="2"
                        placeholder="Difficultés rencontrées..."
                    />

                    <Input
                        label="Perspectives"
                        name="perspectives"
                        textarea
                        value={form.perspectives}
                        onChange={handleChange}
                        rows="2"
                        placeholder="Perspectives pour la semaine suivante..."
                    />

                    {/* Section Tickets GLPI */}
                    <h3 style={{ marginTop: '1rem' }}>Tickets GLPI</h3>
                    {tickets.map((ticket, idx) => (
                        <div key={idx} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <strong>Ticket #{idx + 1}</strong>
                                {tickets.length > 1 && (
                                    <Button type="button" variant="danger" size="small" onClick={() => supprimerTicket(idx)}>
                                        <FaTrash /> Supprimer
                                    </Button>
                                )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input
                                    label="Client"
                                    value={ticket.client}
                                    onChange={(e) => handleTicketChange(idx, 'client', e.target.value)}
                                    placeholder="Ex: SAIPEM"
                                />
                                <Input
                                    label="N° Ticket"
                                    value={ticket.numero}
                                    onChange={(e) => handleTicketChange(idx, 'numero', e.target.value)}
                                    placeholder="Ex: 2321"
                                />
                            </div>
                            <Input
                                label="Nature de l'intervention"
                                value={ticket.nature}
                                onChange={(e) => handleTicketChange(idx, 'nature', e.target.value)}
                                placeholder="Ex: Problème de communication"
                            />
                            <Input
                                label="Intervenant"
                                value={ticket.intervenant}
                                onChange={(e) => handleTicketChange(idx, 'intervenant', e.target.value)}
                                placeholder="Ex: Justie BAKITOUL"
                            />
                        </div>
                    ))}

                    <Button type="button" variant="outline" onClick={ajouterTicket}>
                        <FaPlus /> Ajouter un ticket
                    </Button>

                    {/* Indicateurs calculés automatiquement */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div className="form-group">
                            <label>Nombre d'interventions (auto)</label>
                            <input 
                                type="number" 
                                name="nb_interventions"
                                value={form.nb_interventions || 0} 
                                disabled 
                                style={{ width: '100%', padding: '0.5rem', backgroundColor: '#f0f0f0' }}
                            />
                        </div>
                        <div className="form-group">
                            <label>Heures totales (auto)</label>
                            <input 
                                type="number" 
                                step="0.5" 
                                name="heures_total"
                                value={form.heures_total || 0} 
                                disabled 
                                style={{ width: '100%', padding: '0.5rem', backgroundColor: '#f0f0f0' }}
                            />
                        </div>
                    </div>

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