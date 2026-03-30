import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { authService } from './services/authService';
import 'leaflet/dist/leaflet.css';

// Layout
import Layout from './components/layout/Layout';
import RoleProtectedRoute from './components/common/RoleProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
// import DashboardPage from './pages/DashboardPage'; // plus utilisé
import ClientsPage from './pages/ClientsPage';
import TimeTrackingPage from './pages/TimeTrackingPage';
import ReportsPage from './pages/ReportsPage';
import ReportDetail from './pages/ReportDetail';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import TeamsPage from './pages/TeamsPage';
import RealMissionsPage from './pages/RealMissionsPage';
import MaterielPage from './pages/MaterielPage';
import DashboardPage from './pages/DashboardPage'; // ← AJOUT

// Bons de commande
import BonList from './pages/BonDeCommande/BonList';
import BonForm from './pages/BonDeCommande/BonForm';
import BonDetail from './pages/BonDeCommande/BonDetail';
import BonQR from './pages/BonDeCommande/BonQR';
import ValidationQR from './pages/BonDeCommande/ValidationQR';

// Rapports
import RapportJournalier from './pages/Rapports/RapportJournalier';
import RapportHebdomadaire from './pages/Rapports/RapportHebdomadaire';
import RapportProjet from './pages/Rapports/RapportProjet';
import RapportJournalierForm from './pages/Rapports/RapportJournalierForm';
import RapportJournalierList from './pages/Rapports/RapportJournalierList';
import RapportHebdomadaireForm from './pages/Rapports/RapportHebdomadaireForm';
import RapportHebdomadaireList from './pages/Rapports/RapportHebdomadaireList';
import RapportProjetForm from './pages/Rapports/RapportProjetForm';
import RapportJournalierDetail from './pages/Rapports/RapportJournalierDetail';

// Nouveaux composants pour rapports projet simplifiés (cadres)
import RapportProjetCadreList from './pages/ProjetCadre/RapportProjetCadreList';
import RapportProjetCadreForm from './pages/ProjetCadre/RapportProjetCadreForm';
import RapportProjetCadreDetail from './pages/ProjetCadre/RapportProjetCadreDetail';

// Nouveaux composants pour rapports hebdomadaires (cadres)
import RapportHebdoCadreList from './pages/RapportHebdoCadre/RapportHebdoCadreList';
import RapportHebdoCadreForm from './pages/RapportHebdoCadre/RapportHebdoCadreForm';
import RapportHebdoCadreDetail from './pages/RapportHebdoCadre/RapportHebdoCadreDetail';

// Assistante
import AssistanteDashboard from './pages/Assistante/AssistanteDashboard';
import AssistanteRapports from './pages/Assistante/AssistanteRapports';
import AssistanteBons from './pages/Assistante/AssistanteBons';

// Suivi médical
import SuiviMedicalList from './pages/Assistante/SuiviMedical/SuiviMedicalList';
import SuiviMedicalForm from './pages/Assistante/SuiviMedical/SuiviMedicalForm';

// Missions
import MissionForm from './pages/MissionForm';

// OT
import OTEnCours from './pages/OT/OTEnCours';
import OTClotures from './pages/OT/OTClotures';
import OrdreTravailForm from './pages/OT/OrdreTravailForm';
import OrdreTravailDetail from './pages/OT/OrdreTravailDetail';
import OrdreTravailRapport from './pages/OT/OrdreTravailRapport';
import ValidationOT from './pages/OT/ValidationOT';

// Styles
import './styles/globals.css';

// Composant de redirection pour la page d'accueil
const HomeRedirect = () => {
  const user = authService.getCurrentUser();
  // Si vous voulez que la page d'accueil affiche le tableau de bord, décommentez la ligne suivante
  // return <Navigate to="/dashboard" replace />;
  if (user?.role === 'cadre') {
    return <Navigate to="/rapports-hebdo-cadre" replace />;
  }
  return <Navigate to="/ot-en-cours" replace />;
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    const check = authService.isAuthenticated();
    setAuth(check);
    setLoading(false);
  }, []);

  if (loading) return <div>Chargement...</div>;
  if (!auth) return <Navigate to="/login" replace />;

  return children;
};

// Public Route : si déjà authentifié, redirige vers la racine (qui utilise HomeRedirect)
const PublicRoute = ({ children }) => {
  const isAuth = useMemo(() => authService.isAuthenticated(), []);
  if (isAuth) return <Navigate to="/" replace />;
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [init, setInit] = useState(false);

  useEffect(() => {
    const current = authService.getCurrentUser();
    setUser(current);
    setInit(true);
  }, []);

  const handleLogin = (userData) => setUser(userData);
  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (!init) return <div>Initialisation...</div>;

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage onLogin={handleLogin} /></PublicRoute>} />

        <Route path="/" element={<ProtectedRoute><Layout user={user} onLogout={handleLogout} /></ProtectedRoute>}>
          <Route index element={<HomeRedirect />} />

          {/* Route dashboard ajoutée */}
          <Route path="dashboard" element={<DashboardPage />} />

          <Route path="missions" element={<RealMissionsPage />} />
          <Route path="missions/nouveau" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><MissionForm /></RoleProtectedRoute>} />
          <Route path="time" element={<TimeTrackingPage />} />
          <Route path="profile" element={<ProfilePage />} />

          <Route path="clients" element={<RoleProtectedRoute allowedRoles={['technicien','manager','admin']}><ClientsPage /></RoleProtectedRoute>} />

          <Route path="reports" element={<RoleProtectedRoute allowedRoles={['technicien','manager','admin']}><ReportsPage /></RoleProtectedRoute>} />
          <Route path="reports/:id" element={<RoleProtectedRoute allowedRoles={['technicien','manager','admin']}><ReportDetail /></RoleProtectedRoute>} />

          <Route path="teams" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><TeamsPage /></RoleProtectedRoute>} />

          {/* Bons de commande */}
          <Route path="bons" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><BonList /></RoleProtectedRoute>} />
          <Route path="bons/nouveau" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><BonForm /></RoleProtectedRoute>} />
          <Route path="bons/modifier/:id" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><BonForm /></RoleProtectedRoute>} />
          <Route path="bons/:id" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><BonDetail /></RoleProtectedRoute>} />
          <Route path="bons/qr/:id" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><BonQR /></RoleProtectedRoute>} />
          <Route path="valider-bon/:code" element={<RoleProtectedRoute allowedRoles={['technicien','manager','admin']}><ValidationQR /></RoleProtectedRoute>} />

          {/* Rapports journaliers */}
          <Route path="rapports/journalier" element={<RoleProtectedRoute allowedRoles={['technicien','manager','admin']}><RapportJournalierList /></RoleProtectedRoute>} />
          <Route path="rapports/journalier/nouveau" element={<RoleProtectedRoute allowedRoles={['technicien']}><RapportJournalierForm /></RoleProtectedRoute>} />
          <Route path="rapports/journalier/modifier/:id" element={<RoleProtectedRoute allowedRoles={['technicien','manager','admin']}><RapportJournalierForm /></RoleProtectedRoute>} />
          <Route path="rapports/journalier/:id" element={<RoleProtectedRoute allowedRoles={['technicien','manager','admin']}><RapportJournalierDetail /></RoleProtectedRoute>} />

          {/* Rapports hebdomadaires (anciens) */}
          <Route path="rapports/hebdomadaire" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><RapportHebdomadaireList /></RoleProtectedRoute>} />
          <Route path="rapports/hebdomadaire/nouveau" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><RapportHebdomadaireForm /></RoleProtectedRoute>} />
          <Route path="rapports/hebdomadaire/modifier/:id" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><RapportHebdomadaireForm /></RoleProtectedRoute>} />
          <Route path="rapports/hebdomadaire/:id" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><RapportHebdomadaire /></RoleProtectedRoute>} />

          {/* Anciens rapports de projet (détaillés) */}
          <Route path="rapports/projet" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><RapportProjet /></RoleProtectedRoute>} />
          <Route path="rapports/projet/nouveau" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><RapportProjetForm /></RoleProtectedRoute>} />
          <Route path="rapports/projet/modifier/:id" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><RapportProjetForm /></RoleProtectedRoute>} />

          {/* Rapports projet simplifiés pour cadres */}
          <Route path="rapports-projet-cadre" element={<RoleProtectedRoute allowedRoles={['cadre','manager','admin']}><RapportProjetCadreList /></RoleProtectedRoute>} />
          <Route path="rapports-projet-cadre/nouveau" element={<RoleProtectedRoute allowedRoles={['cadre']}><RapportProjetCadreForm /></RoleProtectedRoute>} />
          <Route path="rapports-projet-cadre/modifier/:id" element={<RoleProtectedRoute allowedRoles={['cadre']}><RapportProjetCadreForm /></RoleProtectedRoute>} />
          <Route path="rapports-projet-cadre/:id" element={<RoleProtectedRoute allowedRoles={['cadre','manager','admin']}><RapportProjetCadreDetail /></RoleProtectedRoute>} />

          {/* Rapports hebdomadaires pour cadres */}
          <Route path="rapports-hebdo-cadre" element={<RoleProtectedRoute allowedRoles={['cadre','manager','admin']}><RapportHebdoCadreList /></RoleProtectedRoute>} />
          <Route path="rapports-hebdo-cadre/nouveau" element={<RoleProtectedRoute allowedRoles={['cadre']}><RapportHebdoCadreForm /></RoleProtectedRoute>} />
          <Route path="rapports-hebdo-cadre/modifier/:id" element={<RoleProtectedRoute allowedRoles={['cadre']}><RapportHebdoCadreForm /></RoleProtectedRoute>} />
          <Route path="rapports-hebdo-cadre/:id" element={<RoleProtectedRoute allowedRoles={['cadre','manager','admin']}><RapportHebdoCadreDetail /></RoleProtectedRoute>} />

          {/* Assistante */}
          <Route path="assistante" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><AssistanteDashboard /></RoleProtectedRoute>} />
          <Route path="assistante/rapports" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><AssistanteRapports /></RoleProtectedRoute>} />
          <Route path="assistante/bons" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><AssistanteBons /></RoleProtectedRoute>} />

          {/* Suivi médical */}
          <Route path="assistante/suivi-medical" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><SuiviMedicalList /></RoleProtectedRoute>} />
          <Route path="assistante/suivi-medical/nouveau" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><SuiviMedicalForm /></RoleProtectedRoute>} />
          <Route path="assistante/suivi-medical/:id" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><SuiviMedicalForm /></RoleProtectedRoute>} />

          {/* Admin */}
          <Route path="admin" element={<RoleProtectedRoute allowedRoles={['admin']}><AdminPage /></RoleProtectedRoute>} />

          {/* OT */}
          <Route path="ot-en-cours" element={<RoleProtectedRoute allowedRoles={['technicien','manager','admin']}><OTEnCours /></RoleProtectedRoute>} />
          <Route path="ot-clotures" element={<RoleProtectedRoute allowedRoles={['technicien','manager','admin']}><OTClotures /></RoleProtectedRoute>} />
          <Route path="ordres-travail/nouveau" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><OrdreTravailForm /></RoleProtectedRoute>} />
          <Route path="ordres-travail/modifier/:id" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><OrdreTravailForm /></RoleProtectedRoute>} />
          <Route path="ordres-travail/:id" element={<RoleProtectedRoute allowedRoles={['technicien','manager','admin']}><OrdreTravailDetail /></RoleProtectedRoute>} />
          <Route path="ordres-travail/:id/rapport" element={<RoleProtectedRoute allowedRoles={['technicien']}><OrdreTravailRapport /></RoleProtectedRoute>} />
          <Route path="validation-ot" element={<RoleProtectedRoute allowedRoles={['manager','admin']}><ValidationOT /></RoleProtectedRoute>} />
        </Route>

        {/* Redirection par défaut vers la racine */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;