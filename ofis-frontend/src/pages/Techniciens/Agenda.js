import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import api from '../../services/api';
import { authService } from '../../services/authService';
import { FaCalendarAlt, FaUser, FaEdit, FaSave, FaTimes, FaPlus } from 'react-icons/fa';

const Agenda = () => {
    const [techniciens, setTechniciens] = useState([]);
    const [agenda, setAgenda] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ statut: '', commentaire: '' });
    const user = authService.getCurrentUser();
    const isManager = user?.role === 'manager' || user?.role === 'admin';
    const isTechnicien = user?.role === 'technicien' || user?.role === 'cadre';

    useEffect(() => {
        chargerDonnees();
    }, [selectedDate]);

    const chargerDonnees = async () => {
        setLoading(true);
        try {
            const techs = await api.getTechnicians();
            
            // Si technicien/cadre, ne garder que lui-même
            let techsFiltres = techs;
            if (isTechnicien) {
                techsFiltres = techs.filter(t => t.user_id === user?.id);
            }
            setTechniciens(techsFiltres);

            // Récupérer l'agenda pour la date
            const agendaData = await api.get(`/agenda/?date=${selectedDate}`);
            setAgenda(agendaData);
        } catch (error) {
            console.error('Erreur chargement agenda:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatutColor = (statut) => {
        const colors = {
            disponible: '#10b981',
            intervention: '#f59e0b',
            indisponible: '#ef4444',
            conges: '#8b5cf6'
        };
        return colors[statut] || '#6b7280';
    };

    const getStatutLabel = (statut) => {
        const labels = {
            disponible: '✅ Disponible',
            intervention: '🟠 En intervention',
            indisponible: '❌ Indisponible',
            conges: '🏖️ Congés'
        };
        return labels[statut] || statut;
    };

    const handleEdit = (entry) => {
        setEditingId(entry.id);
        setEditForm({ statut: entry.statut, commentaire: entry.commentaire || '' });
    };

    const handleSave = async (id) => {
        try {
            await api.patch(`/agenda/${id}/`, editForm);
            setEditingId(null);
            chargerDonnees();
            alert('Agenda mis à jour');
        } catch (error) {
            alert('Erreur lors de la mise à jour');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({ statut: '', commentaire: '' });
    };

    const handleCreate = async (techId) => {
        try {
            await api.post('/agenda/', {
                technicien: techId,
                date: selectedDate,
                heure_debut: '08:00',
                heure_fin: '17:00',
                statut: 'disponible'
            });
            chargerDonnees();
            alert('Agenda créé avec succès');
        } catch (error) {
            console.error('Erreur création agenda:', error);
            alert('Erreur lors de la création : ' + (error.response?.data?.detail || error.message));
        }
    };

    // ===== SEUL LE TECHNICIEN/CADRE PEUT MODIFIER SON PROPRE AGENDA =====
    const canModify = (tech) => {
        // ✅ Seul le technicien/cadre peut modifier son propre agenda
        // ❌ Le manager ne peut PAS modifier (seulement visualiser)
        if (isTechnicien && tech.user_id === user?.id) return true;
        return false;
    };

    const getAgendaForTechnicien = (techId) => {
        return agenda.find(a => a.technicien === techId);
    };

    if (loading) return <div className="loading">Chargement de l'agenda...</div>;

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <h1><FaCalendarAlt /> Agenda des techniciens</h1>
                <div>
                    <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{ width: '200px', display: 'inline-block' }}
                    />
                </div>
            </div>

            <p style={{ color: '#666', marginBottom: '1rem' }}>
                {isManager ? 'Consultation des disponibilités des techniciens' : 'Mon agenda personnel'}
                <br />
                <small>
                    {isManager
                        ? 'Vue pour assigner des tickets et missions (lecture seule)'
                        : 'Mettez à jour votre disponibilité pour la journée'}
                </small>
            </p>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {techniciens.length === 0 ? (
                    <Card><p>Aucun technicien trouvé.</p></Card>
                ) : (
                    techniciens.map(tech => {
                        const entry = getAgendaForTechnicien(tech.id);
                        const isEditing = editingId === entry?.id;
                        const canEdit = canModify(tech);

                        return (
                            <Card key={tech.id} style={{
                                borderLeft: entry ? `4px solid ${getStatutColor(entry.statut)}` : '4px solid #e0e0e0'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <FaUser style={{ color: '#3b82f6' }} />
                                            <h3 style={{ margin: 0 }}>{tech.username}</h3>
                                            <span style={{ fontSize: '0.8rem', color: '#666' }}>
                                                ({tech.first_name} {tech.last_name})
                                            </span>
                                            {!isManager && tech.user_id === user?.id && (
                                                <span style={{ fontSize: '0.7rem', color: '#10b981', background: '#d1fae5', padding: '0.1rem 0.5rem', borderRadius: '12px' }}>
                                                    Vous
                                                </span>
                                            )}
                                            {/* Taux horaire visible SEULEMENT pour les managers */}
                                            {isManager && (
                                                <span style={{ fontSize: '0.7rem', color: '#999', background: '#f0f0f0', padding: '0.1rem 0.5rem', borderRadius: '12px' }}>
                                                    Taux: {tech.taux_horaire?.toLocaleString('fr-FR') || 0} FCFA/h
                                                </span>
                                            )}
                                        </div>
                                        {entry?.commentaire && (
                                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#666' }}>
                                                📝 {entry.commentaire}
                                            </p>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                        {entry && !isEditing ? (
                                            <>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '12px',
                                                    backgroundColor: getStatutColor(entry.statut),
                                                    color: 'white',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 500
                                                }}>
                                                    {getStatutLabel(entry.statut)}
                                                </span>
                                                {/* ===== SEUL LE TECHNICIEN PEUT MODIFIER ===== */}
                                                {canEdit && (
                                                    <Button size="small" variant="outline" onClick={() => handleEdit(entry)}>
                                                        <FaEdit /> Mettre à jour
                                                    </Button>
                                                )}
                                            </>
                                        ) : isEditing ? (
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <select
                                                    value={editForm.statut}
                                                    onChange={(e) => setEditForm({ ...editForm, statut: e.target.value })}
                                                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="disponible">✅ Disponible</option>
                                                    <option value="intervention">🟠 En intervention</option>
                                                    <option value="indisponible">❌ Indisponible</option>
                                                    <option value="conges">🏖️ Congés</option>
                                                </select>
                                                <Input
                                                    type="text"
                                                    value={editForm.commentaire}
                                                    onChange={(e) => setEditForm({ ...editForm, commentaire: e.target.value })}
                                                    placeholder="Commentaire"
                                                    style={{ width: '150px' }}
                                                />
                                                <Button size="small" variant="primary" onClick={() => handleSave(entry.id)}>
                                                    <FaSave /> Enregistrer
                                                </Button>
                                                <Button size="small" variant="outline" onClick={handleCancel}>
                                                    <FaTimes /> Annuler
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '12px',
                                                    backgroundColor: '#e0e0e0',
                                                    color: '#666',
                                                    fontSize: '0.8rem'
                                                }}>
                                                    ⏳ Non défini
                                                </span>
                                                {/* ===== SEUL LE TECHNICIEN PEUT CRÉER ===== */}
                                                {canEdit && (
                                                    <Button size="small" variant="outline" onClick={() => handleCreate(tech.id)}>
                                                        <FaPlus /> Définir
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: '#f8f9fa',
                borderRadius: '8px',
                display: 'flex',
                gap: '1.5rem',
                flexWrap: 'wrap',
                fontSize: '0.8rem'
            }}>
                <span><strong>Légende :</strong></span>
                <span><span style={{ background: '#10b981', padding: '0.15rem 0.5rem', borderRadius: '4px', color: 'white' }}>✅ Disponible</span></span>
                <span><span style={{ background: '#f59e0b', padding: '0.15rem 0.5rem', borderRadius: '4px', color: 'white' }}>🟠 En intervention</span></span>
                <span><span style={{ background: '#ef4444', padding: '0.15rem 0.5rem', borderRadius: '4px', color: 'white' }}>❌ Indisponible</span></span>
                <span><span style={{ background: '#8b5cf6', padding: '0.15rem 0.5rem', borderRadius: '4px', color: 'white' }}>🏖️ Congés</span></span>
            </div>
        </div>
    );
};

export default Agenda;