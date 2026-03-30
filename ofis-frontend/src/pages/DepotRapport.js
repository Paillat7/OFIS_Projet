import React, { useState } from 'react';
import axios from 'axios';
import Button from '../components/common/Button';
import { FaArrowLeft } from 'react-icons/fa';

const DepotRapport = ({ onBack }) => {  // ← AJOUTEZ onBack
    const [titre, setTitre] = useState('');
    const [fichier, setFichier] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        const token = localStorage.getItem('ofis_token');  // ← UTILISEZ ofis_token
        if (!token) {
            alert('Vous devez être connecté pour déposer un rapport');
            onBack();  // ← RETOUR
            return;
        }

        const formData = new FormData();
        formData.append('titre', titre);
        formData.append('fichier', fichier);

        try {
            const res = await axios.post('http://127.0.0.1:8000/api/depot-rapport/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                }
            });

            alert('Rapport déposé avec succès');
            onBack();  // ← RETOUR APRÈS SUCCÈS
        } catch (error) {
            if (error.response && error.response.status === 401) {
                alert('Non autorisé. Veuillez vous connecter à nouveau.');
                onBack();
            } else {
                console.error("Erreur lors du dépôt du rapport : ", error);
                alert('Erreur lors du dépôt du rapport. Veuillez réessayer.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <Button 
                    onClick={onBack} 
                    variant="outline" 
                    size="small"
                >
                    <FaArrowLeft /> Retour
                </Button>
                <h2 style={styles.title}>Déposer un rapport</h2>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Titre du rapport :</label>
                    <input
                        type="text"
                        value={titre}
                        onChange={e => setTitre(e.target.value)}
                        required
                        style={styles.input}
                        placeholder="Ex: Rapport mensuel Mars 2026"
                    />
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>Fichier PDF :</label>
                    <input
                        type="file"
                        onChange={e => setFichier(e.target.files[0])}
                        required
                        accept=".pdf"
                        style={styles.fileInput}
                    />
                </div>

                <Button 
                    type="submit" 
                    variant="primary"
                    disabled={loading}
                    style={styles.submitButton}
                >
                    {loading ? 'Dépôt en cours...' : 'Déposer le rapport'}
                </Button>
            </form>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
    },
    header: {
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
    },
    title: {
        margin: 0,
        color: '#111827',
        fontSize: '1.8rem',
    },
    form: {
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    formGroup: {
        marginBottom: '1.5rem',
    },
    label: {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: 'bold',
        color: '#374151',
    },
    input: {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        fontSize: '1rem',
    },
    fileInput: {
        width: '100%',
        padding: '0.5rem',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        backgroundColor: '#f9fafb',
    },
    submitButton: {
        width: '100%',
        padding: '0.75rem',
        fontSize: '1rem',
    },
};

export default DepotRapport;