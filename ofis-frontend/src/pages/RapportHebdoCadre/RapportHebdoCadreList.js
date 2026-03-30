import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaEye, FaTrash, FaPlus } from 'react-icons/fa';
import { rapportService } from '../../services/rapportService';
import { authService } from '../../services/authService';

const RapportHebdoCadreList = () => {
    const [rapports, setRapports] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = authService.getCurrentUser();
    const isStaff = user?.role === 'manager' || user?.role === 'admin';
    const isCadre = user?.role === 'cadre';

    useEffect(() => {
        chargerRapports();
    }, []);

    const chargerRapports = async () => {
        setLoading(true);
        try {
            const data = await rapportService.getHebdoCadre();
            setRapports(data);
        } catch (error) {
            console.error('Erreur chargement rapports', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Supprimer ce rapport ?')) {
            try {
                await rapportService.deleteHebdoCadre(id);
                chargerRapports();
            } catch (error) {
                alert('Erreur suppression');
            }
        }
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <h1>Rapports hebdomadaires</h1>
                {isCadre && (
                    <Link to="/rapports-hebdo-cadre/nouveau">
                        <Button variant="primary"><FaPlus /> Nouveau rapport</Button>
                    </Link>
                )}
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
                {rapports.length === 0 ? (
                    <Card><p>Aucun rapport hebdomadaire.</p></Card>
                ) : (
                    rapports.map(rapport => (
                        <Card key={rapport.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3>{rapport.cadre_name} – {rapport.date_debut} au {rapport.date_fin}</h3>
                                    <p><strong>Type :</strong> {rapport.type_display}</p>
                                    <p><strong>Total interventions :</strong> {rapport.lignes?.length || 0}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Link to={`/rapports-hebdo-cadre/${rapport.id}`}>
                                        <Button variant="outline" size="small">
                                            <FaEye /> Voir
                                        </Button>
                                    </Link>
                                    {(isStaff || (isCadre && rapport.cadre === user?.id)) && (
                                        <Button 
                                            variant="danger" 
                                            size="small" 
                                            onClick={() => handleDelete(rapport.id)}
                                        >
                                            <FaTrash /> Supprimer
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default RapportHebdoCadreList;