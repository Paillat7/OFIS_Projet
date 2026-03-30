import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import suiviOTService from '../../services/suiviOTService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { FaTrash, FaEdit } from 'react-icons/fa';

const SuiviOTSection = ({ otId, dureeEstimee, technicienId }) => {
    const [suivis, setSuivis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ date: '', heures: '', description: '' });
    const [editId, setEditId] = useState(null);
    const user = authService.getCurrentUser();
    const isTechnicien = user?.role === 'technicien';
    const isStaff = user?.role === 'manager' || user?.role === 'admin';
    const canSaisir = isTechnicien && Number(technicienId) === Number(user?.id);

    useEffect(() => {
        chargerSuivis();
    }, [otId]);

    const chargerSuivis = async () => {
        setLoading(true);
        try {
            const data = await suiviOTService.getAll({ ot: otId });
            setSuivis(data);
        } catch (error) {
            console.error('Erreur chargement suivis', error);
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
        try {
            const dataToSend = { ...form, ot: otId };
            if (editId) {
                await suiviOTService.update(editId, dataToSend);
                setEditId(null);
            } else {
                await suiviOTService.create(dataToSend);
            }
            setForm({ date: '', heures: '', description: '' });
            chargerSuivis();
        } catch (error) {
            console.error(error);
            alert('Erreur lors de l\'enregistrement');
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

    const totalHeures = suivis.reduce((sum, s) => sum + parseFloat(s.heures), 0);
    const isDepasse = dureeEstimee !== null && dureeEstimee !== undefined && totalHeures > dureeEstimee;
    const reste = dureeEstimee !== null && dureeEstimee !== undefined ? (dureeEstimee - totalHeures) : null;

    if (loading) return <div>Chargement des suivis...</div>;

    return (
        <div style={{ marginTop: '2rem' }}>
            <h3>Suivi quotidien des heures</h3>
            {dureeEstimee !== null && dureeEstimee !== undefined && (
                <>
                    <p><strong>Durée estimée :</strong> {dureeEstimee} h</p>
                    <p><strong>Heures déjà saisies :</strong> {totalHeures} h</p>
                    <p><strong>Reste :</strong>
                        <span style={{
                            color: isDepasse ? 'red' : (totalHeures > 0 ? 'green' : 'inherit'),
                            fontWeight: 'bold',
                            marginLeft: '0.5rem'
                        }}>
                            {reste} h
                        </span>
                    </p>
                    {isDepasse && (
                        <p style={{ color: 'red', fontWeight: 'bold', marginTop: '0.5rem' }}>
                            ⚠️ Attention : les heures saisies dépassent la durée estimée de {Math.abs(reste)} h.
                        </p>
                    )}
                </>
            )}

            {canSaisir && (
                <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', border: '1px solid #ccc', padding: '1rem', borderRadius: '4px' }}>
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
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
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

            {suivis.length === 0 ? (
                <p>Aucune saisie pour le moment.</p>
            ) : (
                <table className="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Heures</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suivis.map(s => (
                            <tr key={s.id}>
                                <td>{new Date(s.date).toLocaleDateString()}</td>
                                <td>{s.heures} h</td>
                                <td>{s.description}</td>
                                <td>
                                    {(s.technicien === user?.id || isStaff) && (
                                        <>
                                            <Button size="small" variant="outline" onClick={() => handleEdit(s)}><FaEdit /></Button>
                                            <Button size="small" variant="outline" onClick={() => handleDelete(s.id)}><FaTrash /></Button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default SuiviOTSection;