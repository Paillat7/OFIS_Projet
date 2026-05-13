import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import suiviOTService from '../../services/suiviOTService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { FaTrash, FaEdit, FaEye } from 'react-icons/fa';

const SuiviOTSection = ({ otId, dureeEstimee }) => {
    const [suivis, setSuivis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ date: '', heures: '', description: '' });
    const [editId, setEditId] = useState(null);
    const user = authService.getCurrentUser();
    const isTechnicien = user?.role === 'technicien';
    const canSaisir = isTechnicien; // Seul le technicien peut saisir

    useEffect(() => {
        chargerSuivis();
    }, [otId]);

    const chargerSuivis = async () => {
        setLoading(true);
        try {
            const data = await suiviOTService.getAll({ ot: otId });
            setSuivis(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Erreur chargement suivis', error);
            setSuivis([]);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.heures || parseFloat(form.heures) <= 0) {
            alert('Veuillez saisir un nombre d\'heures valide');
            return;
        }
        try {
            const dataToSend = { 
                ot: parseInt(otId),
                date: form.date,
                heures: parseFloat(form.heures),
                description: form.description,
                technicien: user?.id
            };
            console.log('Envoi des données:', dataToSend);
            
            if (editId) {
                await suiviOTService.update(editId, dataToSend);
                setEditId(null);
            } else {
                await suiviOTService.create(dataToSend);
            }
            setForm({ date: '', heures: '', description: '' });
            chargerSuivis();
        } catch (error) {
            console.error('Erreur détaillée:', error);
            alert('Erreur lors de l\'enregistrement: ' + (error.response?.data?.detail || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Supprimer cette saisie ?')) {
            try {
                await suiviOTService.delete(id);
                chargerSuivis();
            } catch (error) {
                alert('Erreur suppression');
            }
        }
    };

    const handleEdit = (s) => {
        setForm({ date: s.date, heures: s.heures, description: s.description });
        setEditId(s.id);
    };

    // Récupérer le nom du technicien
    const getTechnicienName = (suivi) => {
        if (suivi.technicien_name) return suivi.technicien_name;
        if (suivi.technicien?.username) return suivi.technicien.username;
        if (suivi.technicien) return `Technicien #${suivi.technicien}`;
        return '-';
    };

    const totalHeures = suivis.reduce((sum, s) => sum + parseFloat(s.heures), 0);
    const isDepasse = dureeEstimee && totalHeures > dureeEstimee;
    const reste = dureeEstimee ? (dureeEstimee - totalHeures) : null;

    if (loading) return <div>Chargement des suivis...</div>;

    return (
        <div style={{ marginTop: '2rem' }}>
            <h3>Suivi quotidien des heures</h3>
            
            {dureeEstimee && (
                <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#f8f9fa', borderRadius: '8px' }}>
                    <p><strong>Durée estimée :</strong> {dureeEstimee} h</p>
                    <p><strong>Heures déjà saisies :</strong> {totalHeures} h</p>
                    <p><strong>Reste :</strong> 
                        <span style={{ color: isDepasse ? 'red' : 'green', fontWeight: 'bold' }}>
                            {reste} h
                        </span>
                    </p>
                    {isDepasse && (
                        <p style={{ color: 'red' }}>⚠️ Dépassement de {Math.abs(reste)} h</p>
                    )}
                </div>
            )}

            {/* Formulaire d'ajout - visible seulement pour le technicien */}
            {canSaisir && (
                <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
                    <h4>{editId ? 'Modifier' : 'Ajouter'} une saisie</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <Input
                            label="Date"
                            type="date"
                            name="date"
                            value={form.date}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Heures travaillées"
                            type="number"
                            step="0.5"
                            name="heures"
                            value={form.heures}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <Input
                        label="Description des tâches"
                        textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows="2"
                    />
                    <div style={{ marginTop: '1rem' }}>
                        <Button type="submit" variant="primary" size="small">
                            {editId ? 'Mettre à jour' : 'Ajouter'}
                        </Button>
                        {editId && (
                            <Button type="button" variant="outline" size="small" onClick={() => { setEditId(null); setForm({ date: '', heures: '', description: '' }); }}>
                                Annuler
                            </Button>
                        )}
                    </div>
                </form>
            )}

            {/* Tableau des saisies */}
            {suivis.length === 0 ? (
                <p>Aucune saisie pour le moment.</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse', 
                        background: 'white', 
                        borderRadius: '8px', 
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Heures</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Description</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>👁️ Technicien</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suivis.map(s => {
                                // Seul le technicien propriétaire peut modifier/supprimer
                                const isOwner = s.technicien === user?.id;
                                
                                return (
                                    <tr key={s.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                        <td style={{ padding: '0.75rem' }}>{new Date(s.date).toLocaleDateString()}</td>
                                        <td style={{ padding: '0.75rem' }}>{s.heures} h</td>
                                        <td style={{ padding: '0.75rem' }}>{s.description || '-'}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{ 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                gap: '0.5rem',
                                                background: '#f0f0f0',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.8rem'
                                            }}>
                                                <FaEye size={12} /> {getTechnicienName(s)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                            {isOwner && (
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button 
                                                        onClick={() => handleEdit(s)} 
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1976D2' }}
                                                        title="Modifier"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(s.id)} 
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                        title="Supprimer"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: '#f8f9fa', fontWeight: 'bold' }}>
                                <td style={{ padding: '0.75rem' }}>Total</td>
                                <td style={{ padding: '0.75rem' }}>{totalHeures} h</td>
                                <td colSpan="3"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SuiviOTSection;