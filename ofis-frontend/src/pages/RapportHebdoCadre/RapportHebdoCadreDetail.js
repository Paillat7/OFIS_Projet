import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FaArrowLeft, FaTrash } from 'react-icons/fa';
import { rapportService } from '../../services/rapportService';
import { authService } from '../../services/authService';

const RapportHebdoCadreDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [rapport, setRapport] = useState(null);
    const [loading, setLoading] = useState(true);
    const user = authService.getCurrentUser();
    const isStaff = user?.role === 'manager' || user?.role === 'admin';
    const isCadre = user?.role === 'cadre';
    const canDelete = isStaff || (isCadre && rapport?.cadre === user?.id);

    useEffect(() => {
        chargerRapport();
    }, [id]);

    const chargerRapport = async () => {
        try {
            const data = await rapportService.getHebdoCadre(id);
            setRapport(data);
        } catch (error) {
            console.error('Erreur chargement rapport', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Supprimer ce rapport ?')) {
            try {
                await rapportService.deleteHebdoCadre(id);
                navigate('/rapports-hebdo-cadre');
            } catch (error) {
                alert('Erreur suppression');
            }
        }
    };

    if (loading) return <div>Chargement...</div>;
    if (!rapport) return <div>Rapport non trouvé</div>;

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <Button variant="outline" onClick={() => navigate(-1)}>
                    <FaArrowLeft /> Retour
                </Button>
                <h1>Rapport hebdomadaire</h1>
                {canDelete && (
                    <Button variant="danger" onClick={handleDelete}>
                        <FaTrash /> Supprimer
                    </Button>
                )}
            </div>
            <Card>
                <p><strong>Cadre :</strong> {rapport.cadre_name}</p>
                <p><strong>Période :</strong> {rapport.date_debut} – {rapport.date_fin}</p>
                <p><strong>Type :</strong> {rapport.type_display}</p>
                
                <h3>Résumé de la semaine</h3>
                <p>{rapport.resume || '-'}</p>
                
                <h3>Actions notables</h3>
                <p>{rapport.actions_notables || '-'}</p>
                
                <h3>Difficultés rencontrées</h3>
                <p>{rapport.difficultes || '-'}</p>
                
                <h3>Perspectives</h3>
                <p>{rapport.perspectives || '-'}</p>

                {/* Section Tickets GLPI */}
                {rapport.tickets && rapport.tickets.length > 0 && (
                    <>
                        <h3>Tickets GLPI</h3>
                        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f2f2f2' }}>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Client</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>N° Ticket</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Nature</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Intervenant</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rapport.tickets.map((ticket, idx) => (
                                    <tr key={idx}>
                                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{ticket.client || '-'}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{ticket.numero || '-'}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{ticket.nature || '-'}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{ticket.intervenant || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
                
                <h3>Indicateurs</h3>
                <p><strong>Nombre d'interventions :</strong> {rapport.nb_interventions || 0}</p>
                <p><strong>Heures totales :</strong> {rapport.heures_total || 0} h</p>
            </Card>
        </div>
    );
};

export default RapportHebdoCadreDetail;