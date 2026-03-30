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
                <h3>Détail des interventions</h3>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Client</th>
                            <th>Nature de l’intervention</th>
                            <th>Avancement / Résultat</th>
                            <th>Début</th>
                            <th>Fin</th>
                            <th>N° Ticket</th>
                            <th>Intervenant</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rapport.lignes && rapport.lignes.map((ligne, idx) => (
                            <tr key={idx}>
                                <td>{ligne.client_name}</td>
                                <td>{ligne.nature_intervention}</td>
                                <td>{ligne.avancement_resultat}</td>
                                <td>{ligne.date_debut}</td>
                                <td>{ligne.date_fin}</td>
                                <td>{ligne.numero_ticket}</td>
                                <td>{ligne.intervenant_name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default RapportHebdoCadreDetail;