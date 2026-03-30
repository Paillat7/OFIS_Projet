import React, { useState, useEffect } from 'react';
const img1 = '/Images/ofisem1.png';  // ← Chemin corrigé vers l'image dans public/Images/
import { 
  // Icônes pour les actions (play, stop, pause, etc.)
  FaPlay, FaStop, FaPause, FaClock, 
  // Icônes pour les équipes et utilisateurs
  FaUsers, FaUserTie, FaWrench, FaChartLine, 
  // Icônes pour la localisation
  FaMapMarkerAlt, FaMapPin, FaLocationArrow,
  // Icônes pour les tâches et missions
  FaCalendarAlt, FaTasks, FaClock as FaClockRegular,
  // Icônes pour les actions CRUD
  FaPlus, FaEdit, FaTrash, FaSearch,
  // Icônes pour les statuts
  FaCheckCircle, FaBan, FaHourglassHalf,
  // Icônes pour les utilisateurs
  FaUser, FaEnvelope,
  // Icônes pour les services (SELON TA DEMANDE)
  FaBroadcastTower,     // Pour OBT Radio
  FaMapMarkedAlt,       // Pour OBT Géolocalisation
  FaNetworkWired,       // Pour OSN Réseau
  FaServer,             // Pour OSN Système
  // Icônes supplémentaires pour le hardware (TOUTES EXISTENT)
  FaMicrochip,          // Pour les composants
  FaEthernet,           // Pour le câblage
  FaSatellite,          // Pour les communications
  FaWifi,               // Alternative pour radio
  FaMobile,             // Pour équipements mobiles
  FaLaptop,             // Pour ordinateurs
  FaRss,                // Pour antennes (existe - REMPLACE FaAntenna)
  FaHardHat,            // Pour équipement de sécurité
  FaBolt,               // Pour alimentation/énergie
  FaHdd,                // Pour disques durs
  FaMemory,             // Pour mémoire RAM
  FaBluetooth           // Pour périphériques sans fil
} from 'react-icons/fa';

import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { userService } from '../services/userService';
import './Pages.css';

// ===== 1. DÉFINITION DES SERVICES =====
const SERVICES = [
  { 
    id: 'OBT Radio', 
    name: 'OBT Radio', 
    icon: <FaBroadcastTower />,
    color: '#ef4444',
    description: 'Équipements radio, antennes, émetteurs'
  },
  { 
    id: 'OBT Géolocalisation', 
    name: 'OBT Géolocalisation', 
    icon: <FaMapMarkedAlt />,
    color: '#f59e0b',
    description: 'Balises GPS, traceurs, géolocalisation'
  },
  { 
    id: 'OSN Réseau', 
    name: 'OSN Réseau', 
    icon: <FaNetworkWired />,
    color: '#3b82f6',
    description: 'Équipements réseau, câblage, switches'
  },
  { 
    id: 'OSN Système', 
    name: 'OSN Système', 
    icon: <FaServer />,
    color: '#10b981',
    description: 'Serveurs, logiciels, systèmes'
  }
];

// ===== 2. HARDWARE PAR SERVICE (DONNÉES EXISTANTES) =====
const HARDWARE_PAR_SERVICE = {
  'OBT Radio': [
    { id: 101, name: 'Émetteur radio HF', type: 'émetteur', serialNumber: 'ER-HF-001' },
    { id: 102, name: 'Émetteur radio VHF', type: 'émetteur', serialNumber: 'ER-VHF-002' },
    { id: 103, name: 'Antenne directive', type: 'antenne', serialNumber: 'AD-2024-001' },
    { id: 104, name: 'Antenne omnidirectionnelle', type: 'antenne', serialNumber: 'AO-2024-002' },
    { id: 105, name: 'Câble coaxial 1/2', type: 'câble', serialNumber: 'CC-1/2-001' },
    { id: 106, name: 'Câble coaxial 7/8', type: 'câble', serialNumber: 'CC-7/8-002' },
    { id: 107, name: 'Connecteur N-type', type: 'connecteur', serialNumber: 'CN-001' },
    { id: 108, name: 'Connecteur 7/16', type: 'connecteur', serialNumber: 'C7-001' }
  ],
  'OBT Géolocalisation': [
    { id: 401, name: 'GPS portable', type: 'gps', serialNumber: 'GPS-001' },
    { id: 402, name: 'Traceur véhicule', type: 'traceur', serialNumber: 'TRV-001' },
    { id: 403, name: 'Antenne GPS', type: 'antenne', serialNumber: 'AG-001' },
    { id: 404, name: 'Batterie portable', type: 'accessoire', serialNumber: 'BT-001' },
    { id: 405, name: 'Support véhicule', type: 'accessoire', serialNumber: 'SPV-001' }
  ],
  'OSN Réseau': [
    { id: 301, name: 'Switch Cisco', type: 'switch', serialNumber: 'SW-CS-001' },
    { id: 302, name: 'Routeur Cisco', type: 'routeur', serialNumber: 'RT-CS-001' },
    { id: 303, name: 'Pare-feu', type: 'sécurité', serialNumber: 'PF-001' },
    { id: 304, name: 'Câble RJ45', type: 'câble', serialNumber: 'RJ-001' },
    { id: 305, name: 'Câble fibre', type: 'câble', serialNumber: 'FB-001' },
    { id: 306, name: 'Connecteur RJ45', type: 'connecteur', serialNumber: 'CRJ-001' },
    { id: 307, name: 'Testeur réseau', type: 'testeur', serialNumber: 'TR-001' },
    { id: 308, name: 'Pince à sertir', type: 'outillage', serialNumber: 'PS-001' }
  ],
  'OSN Système': [
    { id: 201, name: 'Serveur HP', type: 'serveur', serialNumber: 'SVR-HP-001' },
    { id: 202, name: 'Serveur Dell', type: 'serveur', serialNumber: 'SVR-DL-002' },
    { id: 203, name: 'Baie de stockage', type: 'stockage', serialNumber: 'BS-001' },
    { id: 204, name: 'Carte mère', type: 'composant', serialNumber: 'CM-001' },
    { id: 205, name: 'Alimentation', type: 'composant', serialNumber: 'AL-001' },
    { id: 206, name: 'Disque dur', type: 'stockage', serialNumber: 'DD-001' },
    { id: 207, name: 'RAM', type: 'composant', serialNumber: 'RAM-001' }
  ]
};

// ===== 3. DONNÉES DE TEST =====
const MOCK_USERS = [
  { id: 1, username: 'admin', email: 'admin@ofis.com', is_superuser: true, is_staff: false, is_active: true },
  { id: 2, username: 'vianney', email: 'vianney@ofis.com', is_superuser: false, is_staff: true, is_active: true },
  { id: 3, username: 'Achille', email: 'achille@ofis.com', is_superuser: false, is_staff: true, is_active: true },
  { id: 4, username: 'Brice', email: 'brice@ofis.com', is_superuser: false, is_staff: false, is_active: true },
  { id: 5, username: 'Siven', email: 'siven@ofis.com', is_superuser: false, is_staff: false, is_active: true },
  { id: 6, username: 'Donald', email: 'donald@ofis.com', is_superuser: false, is_staff: false, is_active: true },
  { id: 7, username: 'Cécilia', email: 'cecilia@ofis.com', is_superuser: false, is_staff: false, is_active: true },
  { id: 8, username: 'Yannistia', email: 'yannistia@ofis.com', is_superuser: false, is_staff: false, is_active: true },
];

// ===== 4. FONCTION POUR OBTENIR L'ICÔNE SELON LE TYPE =====
const getIconForHardware = (item) => {
  const type = item.type?.toLowerCase() || '';
  const name = item.name?.toLowerCase() || '';
  
  if (type.includes('antenne') || name.includes('antenne')) return <FaRss />;
  if (type.includes('câble') || name.includes('câble')) return <FaEthernet />;
  if (type.includes('switch') || name.includes('switch')) return <FaNetworkWired />;
  if (type.includes('routeur') || name.includes('routeur')) return <FaNetworkWired />;
  if (type.includes('gps') || name.includes('gps')) return <FaSatellite />;
  if (type.includes('traceur') || name.includes('traceur')) return <FaMapMarkerAlt />;
  if (type.includes('serveur') || name.includes('serveur')) return <FaServer />;
  if (type.includes('disque') || name.includes('disque')) return <FaHdd />;
  if (type.includes('mémoire') || name.includes('ram')) return <FaMemory />;
  if (type.includes('logiciel') || name.includes('logiciel')) return <FaLaptop />;
  if (type.includes('alimentation') || name.includes('alimentation')) return <FaBolt />;
  if (type.includes('sécurité') || name.includes('sécurité')) return <FaHardHat />;
  
  return <FaMicrochip />;
};

// ===== 5. COMPOSANT PRINCIPAL =====
const TeamsPage = () => {
  // ===== ÉTATS EXISTANTS =====
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [initialized, setInitialized] = useState(false);
  
  // États pour les modals existants
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [showAddMissionModal, setShowAddMissionModal] = useState(false);
  const [showEditMissionModal, setShowEditMissionModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedMission, setSelectedMission] = useState(null);
  
  // ===== NOUVEAUX ÉTATS POUR LE MATÉRIEL =====
  const [showAddMaterielModal, setShowAddMaterielModal] = useState(false);
  const [materielForm, setMaterielForm] = useState({
    name: '',
    type: 'equipement',
    modele: '',
    fournisseur: '',
    reference: '',
    description: '',
    quantite: 1,
    image: ''  // ← AJOUTÉ POUR L'IMAGE
  });
  
  // Formulaire pour les équipes
  const [teamForm, setTeamForm] = useState({
    name: '', service: '', location: '', leaderId: '', memberIds: []
  });
  
  // Formulaire pour les missions
  const [missionForm, setMissionForm] = useState({
    title: '', client: '', location: '', startDate: '', endDate: '',
    status: 'planifiee', priority: 'moyenne', description: '', assignedTo: [], hours: 0
  });

  // ===== 6. CHARGEMENT DES DONNÉES =====
  useEffect(() => {
    if (initialized) return;
    loadData();
  }, [initialized]);

  const loadData = async () => {
    setLoading(true);
    await loadUsers();
    loadTeams();
    setInitialized(true);
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      const result = await userService.getAll();
      if (result.success && result.data.length > 0) {
        setUsers(result.data);
      } else {
        setUsers(MOCK_USERS);
      }
    } catch (error) {
      console.warn("⚠️ Utilisation des données de test");
      setUsers(MOCK_USERS);
    }
  };

  const loadTeams = () => {
    try {
      const savedTeams = localStorage.getItem('ofis_teams');
      if (savedTeams) {
        setTeams(JSON.parse(savedTeams));
      } else {
        setTimeout(() => {
          const defaultTeams = createDefaultTeams();
          if (defaultTeams.length > 0) {
            setTeams(defaultTeams);
            localStorage.setItem('ofis_teams', JSON.stringify(defaultTeams));
          }
        }, 500);
      }
    } catch (error) {
      console.error("❌ Erreur chargement équipes:", error);
    }
  };

  const createDefaultTeams = () => {
    if (users.length === 0) return [];

    const admins = users.filter(u => u.is_superuser);
    const managers = users.filter(u => u.is_staff && !u.is_superuser);
    const techniciens = users.filter(u => !u.is_staff && !u.is_superuser);

    return SERVICES.map((service, index) => {
      const techsPerTeam = Math.max(1, Math.floor(techniciens.length / SERVICES.length));
      const start = index * techsPerTeam;
      const end = start + techsPerTeam;
      const membersForService = techniciens.slice(start, end).map(u => u.id);
      
      return {
        id: Date.now() + index,
        name: `Équipe ${service.name}`,
        service: service.id,
        location: index % 2 === 0 ? 'Pointe-Noire' : 'Brazzaville',
        leaderId: managers[index]?.id || admins[0]?.id || null,
        memberIds: membersForService,
        missions: [],
        hardware: HARDWARE_PAR_SERVICE[service.id] || []
      };
    });
  };

  const saveTeams = (newTeams) => {
    setTeams(newTeams);
    localStorage.setItem('ofis_teams', JSON.stringify(newTeams));
  };

  // ===== 7. FONCTIONS UTILITAIRES =====
  const getUserById = (id) => users.find(u => u.id === id) || { username: 'Inconnu', email: '' };
  const getTeamLeader = (team) => team.leaderId ? getUserById(team.leaderId) : null;
  const getTeamMembers = (team) => {
    if (!team || !team.memberIds) return [];
    return team.memberIds.map(id => getUserById(id)).filter(u => u.id);
  };
  const getServiceInfo = (serviceId) => SERVICES.find(s => s.id === serviceId) || SERVICES[0];

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ===== 8. GESTION DES ÉQUIPES =====
  const handleAddTeam = () => {
    const newTeam = {
      id: Date.now(),
      name: teamForm.name,
      service: teamForm.service,
      location: teamForm.location,
      leaderId: teamForm.leaderId ? parseInt(teamForm.leaderId) : null,
      memberIds: teamForm.memberIds.map(id => parseInt(id)),
      missions: [],
      hardware: HARDWARE_PAR_SERVICE[teamForm.service] || []
    };
    saveTeams([...teams, newTeam]);
    setShowAddTeamModal(false);
    resetTeamForm();
  };

  const handleEditTeam = () => {
    const updatedTeams = teams.map(team => 
      team.id === selectedTeam.id 
        ? { 
            ...team, 
            name: teamForm.name,
            service: teamForm.service,
            location: teamForm.location,
            leaderId: teamForm.leaderId ? parseInt(teamForm.leaderId) : null,
            memberIds: teamForm.memberIds.map(id => parseInt(id))
          }
        : team
    );
    saveTeams(updatedTeams);
    setShowEditTeamModal(false);
    resetTeamForm();
  };

  const handleDeleteTeam = (teamId) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette équipe ?')) {
      saveTeams(teams.filter(team => team.id !== teamId));
    }
  };

  // ===== 9. GESTION DES MISSIONS =====
  const handleAddMission = () => {
    if (!selectedTeam) return;
    
    const newMission = {
      id: Date.now(),
      ...missionForm,
      assignedTo: missionForm.assignedTo
    };
    
    const updatedTeams = teams.map(team => 
      team.id === selectedTeam.id 
        ? { ...team, missions: [...(team.missions || []), newMission] }
        : team
    );
    
    saveTeams(updatedTeams);
    setShowAddMissionModal(false);
    resetMissionForm();
  };

  const handleEditMission = () => {
    if (!selectedTeam || !selectedMission) return;
    
    const updatedTeams = teams.map(team => 
      team.id === selectedTeam.id 
        ? { 
            ...team, 
            missions: (team.missions || []).map(m => 
              m.id === selectedMission.id 
                ? { ...missionForm, id: m.id, assignedTo: missionForm.assignedTo }
                : m
            )
          }
        : team
    );
    
    saveTeams(updatedTeams);
    setShowEditMissionModal(false);
    resetMissionForm();
  };

  const handleDeleteMission = (teamId, missionId) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette mission ?')) {
      const updatedTeams = teams.map(team => 
        team.id === teamId 
          ? { ...team, missions: (team.missions || []).filter(m => m.id !== missionId) }
          : team
      );
      saveTeams(updatedTeams);
    }
  };

  const handleStatusChange = (teamId, missionId, newStatus) => {
    const updatedTeams = teams.map(team => 
      team.id === teamId 
        ? { 
            ...team, 
            missions: (team.missions || []).map(m => 
              m.id === missionId ? { ...m, status: newStatus } : m
            )
          }
        : team
    );
    saveTeams(updatedTeams);
  };

  // ===== 10. GESTION DU MATÉRIEL (AVEC IMAGE) =====
  const handleAddMateriel = () => {
    if (!selectedTeam) return;
    
    const newMateriel = {
      id: Date.now(),
      name: materielForm.name,
      type: materielForm.type,
      modele: materielForm.modele,
      fournisseur: materielForm.fournisseur,
      reference: materielForm.reference,
      description: materielForm.description,
      quantite: materielForm.quantite,
      image: materielForm.image  // ← AJOUTÉ POUR L'IMAGE
    };
    
    const updatedTeams = teams.map(team => 
      team.id === selectedTeam.id 
        ? { 
            ...team, 
            hardware: [...(team.hardware || []), newMateriel] 
          }
        : team
    );
    
    saveTeams(updatedTeams);
    setShowAddMaterielModal(false);
    setMaterielForm({
      name: '', type: 'equipement', modele: '', fournisseur: '', 
      reference: '', description: '', quantite: 1, image: ''
    });
  };

  const handleDeleteMateriel = (teamId, itemId) => {
    if (window.confirm('Supprimer cet équipement ?')) {
      const updatedTeams = teams.map(team => 
        team.id === teamId 
          ? { ...team, hardware: (team.hardware || []).filter(h => h.id !== itemId) }
          : team
      );
      saveTeams(updatedTeams);
    }
  };

  // ===== 11. RÉINITIALISATION =====
  const resetTeamForm = () => {
    setTeamForm({ name: '', service: '', location: '', leaderId: '', memberIds: [] });
  };

  const resetMissionForm = () => {
    setMissionForm({
      title: '', client: '', location: '', startDate: '', endDate: '',
      status: 'planifiee', priority: 'moyenne', description: '', assignedTo: [], hours: 0
    });
  };

  // ===== 12. OUVERTURE DES MODALS =====
  const openAddTeamModal = () => { resetTeamForm(); setShowAddTeamModal(true); };
  
  const openEditTeam = (team) => {
    setSelectedTeam(team);
    setTeamForm({
      name: team.name,
      service: team.service,
      location: team.location,
      leaderId: team.leaderId || '',
      memberIds: team.memberIds || []
    });
    setShowEditTeamModal(true);
  };

  const openAddMission = (team) => {
    setSelectedTeam(team);
    setMissionForm({
      title: '', client: '', location: '', startDate: '', endDate: '',
      status: 'planifiee', priority: 'moyenne', description: '',
      assignedTo: team.memberIds || [], hours: 0
    });
    setShowAddMissionModal(true);
  };

  const openEditMission = (team, mission) => {
    setSelectedTeam(team);
    setSelectedMission(mission);
    setMissionForm({
      title: mission.title || '',
      client: mission.client || '',
      location: mission.location || '',
      startDate: mission.startDate || '',
      endDate: mission.endDate || '',
      status: mission.status || 'planifiee',
      priority: mission.priority || 'moyenne',
      description: mission.description || '',
      assignedTo: mission.assignedTo || [],
      hours: mission.hours || 0
    });
    setShowEditMissionModal(true);
  };

  // ===== 13. BADGES =====
  const StatusBadge = ({ status }) => {
    const config = {
      'en_cours': { color: '#10b981', label: 'En cours', icon: <FaCheckCircle /> },
      'planifiee': { color: '#f59e0b', label: 'Planifiée', icon: <FaClockRegular /> },
      'terminee': { color: '#6b7280', label: 'Terminée', icon: <FaBan /> }
    };
    const { color, label, icon } = config[status] || config['planifiee'];
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', backgroundColor: color, color: 'white', fontSize: '0.8rem' }}>
        {icon} {label}
      </span>
    );
  };

  const PriorityBadge = ({ priority }) => {
    const config = {
      'haute': { color: '#ef4444', label: 'Haute' },
      'moyenne': { color: '#f59e0b', label: 'Moyenne' },
      'basse': { color: '#10b981', label: 'Basse' }
    };
    const { color, label } = config[priority] || config['moyenne'];
    return (
      <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: color + '20', color: color, fontSize: '0.8rem', fontWeight: 'bold' }}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-page loading">
        <div className="loading-spinner"></div>
        <p>Chargement des équipes...</p>
      </div>
    );
  }

  const techniciens = users.filter(u => !u.is_staff && !u.is_superuser);
  const managers = users.filter(u => u.is_staff && !u.is_superuser);

  return (
    <div className="dashboard-page">
      {/* En-tête */}
      <div className="page-header">
        <div>
          <h1>Gestion des équipes techniques</h1>
          <p style={{ color: '#666', marginTop: '0.5rem' }}>
            {users.length} utilisateurs • {techniciens.length} techniciens • {managers.length} managers
          </p>
        </div>
        <Button variant="primary" onClick={openAddTeamModal}>
          <FaPlus /> Nouvelle équipe
        </Button>
      </div>

      {/* Barre de recherche */}
      <Card style={{ marginBottom: '2rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <FaSearch style={{ position: 'absolute', left: '10px', top: '12px', color: '#999' }} />
            <input
              type="text"
              placeholder="Rechercher une équipe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 35px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '1rem' }}
            />
          </div>
        </div>
      </Card>

      {/* Aperçu des services */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {SERVICES.map(service => (
          <Card 
            key={service.id} 
            style={{ 
              padding: '1rem', 
              textAlign: 'center',
              borderTop: `3px solid ${service.color}`,
              cursor: 'pointer'
            }}
            onClick={() => setSearchTerm(service.name)}
          >
            <div style={{ fontSize: '2rem', color: service.color, marginBottom: '0.5rem' }}>
              {service.icon}
            </div>
            <h3>{service.name}</h3>
            <p style={{ fontSize: '0.8rem', color: '#666' }}>{service.description}</p>
            <p style={{ color: service.color, fontWeight: 'bold', marginTop: '0.5rem' }}>
              {teams.filter(t => t.service === service.id).length} équipes
            </p>
          </Card>
        ))}
      </div>

      {/* Liste des équipes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {filteredTeams.map(team => {
          const leader = getTeamLeader(team);
          const members = getTeamMembers(team);
          const serviceInfo = getServiceInfo(team.service);
          const teamHardware = team.hardware || HARDWARE_PAR_SERVICE[team.service] || [];

          return (
            <Card key={team.id} className="team-card" style={{ borderLeft: `4px solid ${serviceInfo.color}` }}>
              {/* En-tête de l'équipe */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '8px', backgroundColor: serviceInfo.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                    {serviceInfo.icon}
                  </div>
                  <div>
                    <h2 style={{ margin: '0 0 0.25rem 0' }}>{team.name}</h2>
                    <p style={{ margin: 0, color: '#666' }}>{team.service} • {team.location}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="outline" size="small" onClick={() => openEditTeam(team)}><FaEdit /></Button>
                  <Button variant="outline" size="small" onClick={() => handleDeleteTeam(team.id)}><FaTrash /></Button>
                  <Button variant="primary" size="small" onClick={() => openAddMission(team)}><FaPlus /> Mission</Button>
                </div>
              </div>

              {/* Chef d'équipe */}
              {leader && (
                <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: leader.is_superuser ? '#f59e0b' : '#1E6FD9', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {leader.username?.substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '1.1rem' }}>{leader.username}</strong>
                      <p style={{ margin: '0.25rem 0', color: '#666' }}>
                        {leader.email}
                        {leader.is_superuser && ' (Admin)'}
                        {leader.is_staff && !leader.is_superuser && ' (Manager)'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Membres de l'équipe */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Membres ({members.length})</h3>
                {members.length > 0 ? (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {members.map(member => (
                      <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                        <div>
                          <strong>{member.username}</strong>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>{member.email}</p>
                        </div>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '12px', backgroundColor: member.is_active ? '#d1fae5' : '#fee2e2', color: member.is_active ? '#065f46' : '#991b1b', fontSize: '0.8rem' }}>
                          {member.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#666', fontStyle: 'italic', padding: '0.5rem' }}>Aucun technicien assigné</p>
                )}
              </div>

              {/* ===== SECTION MATÉRIEL AVEC IMAGES ===== */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', margin: 0 }}>📦 Matériel ({teamHardware.length})</h3>
                  <Button 
                    size="small" 
                    variant="outline"
                    onClick={() => {
                      setSelectedTeam(team);
                      setShowAddMaterielModal(true);
                    }}
                  >
                    <FaPlus /> Ajouter
                  </Button>
                </div>
                
                {teamHardware.length > 0 ? (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {teamHardware.map(item => (
                      <div key={item.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        {/* AFFICHAGE DE L'IMAGE OU DE L'ICÔNE */}
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '8px',
                          backgroundColor: serviceInfo.color + '20',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: '1.5rem', color: serviceInfo.color }}>
                              {getIconForHardware(item)}
                            </span>
                          )}
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong>{item.name || item.nom}</strong>
                              {item.reference && (
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
                                  ({item.reference})
                                </span>
                              )}
                            </div>
                            <Button 
                              variant="icon" 
                              size="small"
                              onClick={() => handleDeleteMateriel(team.id, item.id)}
                              style={{ color: '#ef4444' }}
                            >
                              <FaTrash size={14} />
                            </Button>
                          </div>
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                            {item.modele && <span>Modèle: {item.modele}</span>}
                            {item.fournisseur && <span>Fournisseur: {item.fournisseur}</span>}
                            {item.type && <span>Type: {item.type}</span>}
                          </div>
                          {item.description && (
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#666' }}>
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#666', fontStyle: 'italic', padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                    Aucun matériel assigné
                  </p>
                )}
              </div>

              {/* Missions */}
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Missions ({team.missions?.length || 0})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {(team.missions || []).map(mission => (
                    <div key={mission.id} style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0 }}>{mission.title}</h4>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button variant="outline" size="small" onClick={() => openEditMission(team, mission)}><FaEdit /></Button>
                          <Button variant="outline" size="small" onClick={() => handleDeleteMission(team.id, mission.id)}><FaTrash /></Button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <p style={{ margin: '0.25rem 0', color: '#666' }}><strong>Client:</strong> {mission.client}</p>
                          <p style={{ margin: '0.25rem 0', color: '#666' }}><FaMapMarkerAlt /> {mission.location}</p>
                          <p style={{ margin: '0.25rem 0', color: '#666' }}><FaCalendarAlt /> {mission.startDate} - {mission.endDate}</p>
                        </div>
                        <div>
                          <p style={{ margin: '0.25rem 0' }}><StatusBadge status={mission.status} /></p>
                          <p style={{ margin: '0.25rem 0' }}><PriorityBadge priority={mission.priority} /></p>
                          <p style={{ margin: '0.25rem 0', color: '#666' }}><FaClock /> {mission.hours}h estimées</p>
                        </div>
                      </div>

                      <p style={{ margin: '0.5rem 0', color: '#666', fontSize: '0.9rem' }}>{mission.description}</p>

                      <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f0f9ff', borderRadius: '4px' }}>
                        <strong>👥 Techniciens assignés:</strong>{' '}
                        {mission.assignedTo && mission.assignedTo.length > 0 ? (
                          <span>{mission.assignedTo.map(id => getUserById(id).username).join(', ')}</span>
                        ) : (
                          <span style={{ color: '#666' }}>Aucun technicien assigné</span>
                        )}
                      </div>

                      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <Button size="small" variant={mission.status === 'planifiee' ? 'primary' : 'outline'} onClick={() => handleStatusChange(team.id, mission.id, 'planifiee')}>Planifier</Button>
                        <Button size="small" variant={mission.status === 'en_cours' ? 'primary' : 'outline'} onClick={() => handleStatusChange(team.id, mission.id, 'en_cours')}>En cours</Button>
                        <Button size="small" variant={mission.status === 'terminee' ? 'primary' : 'outline'} onClick={() => handleStatusChange(team.id, mission.id, 'terminee')}>Terminer</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ===== MODAL D'AJOUT D'ÉQUIPE ===== */}
      {showAddTeamModal && (
        <Modal isOpen={showAddTeamModal} onClose={() => setShowAddTeamModal(false)} title="Créer une nouvelle équipe">
          <form onSubmit={(e) => { e.preventDefault(); handleAddTeam(); }}>
            <Input label="Nom de l'équipe" value={teamForm.name} onChange={(e) => setTeamForm({...teamForm, name: e.target.value})} required />
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Service</label>
              <select value={teamForm.service} onChange={(e) => setTeamForm({...teamForm, service: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px' }} required>
                <option value="">Sélectionner...</option>
                {SERVICES.map(service => <option key={service.id} value={service.id}>{service.name}</option>)}
              </select>
            </div>
            <Input label="Localisation" value={teamForm.location} onChange={(e) => setTeamForm({...teamForm, location: e.target.value})} required />
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Chef d'équipe</label>
              <select value={teamForm.leaderId} onChange={(e) => setTeamForm({...teamForm, leaderId: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                <option value="">Sélectionner...</option>
                {users.filter(u => u.is_staff || u.is_superuser).map(user => (
                  <option key={user.id} value={user.id}>{user.username} {user.is_superuser ? '(Admin)' : '(Manager)'}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Membres de l'équipe (Techniciens)</label>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
                {users.filter(u => !u.is_superuser && !u.is_staff).map(user => (
                  <label key={user.id} style={{ display: 'block', margin: '0.5rem 0' }}>
                    <input type="checkbox" value={user.id} checked={teamForm.memberIds.includes(user.id)} onChange={(e) => {
                      const id = parseInt(e.target.value);
                      setTeamForm({ ...teamForm, memberIds: e.target.checked ? [...teamForm.memberIds, id] : teamForm.memberIds.filter(mid => mid !== id) });
                    }} style={{ marginRight: '10px' }} />
                    {user.username} ({user.email})
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setShowAddTeamModal(false)}>Annuler</Button>
              <Button type="submit" variant="primary">Créer l'équipe</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ===== MODAL D'AJOUT DE MISSION ===== */}
      {showAddMissionModal && selectedTeam && (
        <Modal isOpen={showAddMissionModal} onClose={() => setShowAddMissionModal(false)} title={`Ajouter une mission à ${selectedTeam.name}`}>
          <form onSubmit={(e) => { e.preventDefault(); handleAddMission(); }}>
            <Input label="Titre de la mission" value={missionForm.title} onChange={(e) => setMissionForm({...missionForm, title: e.target.value})} required />
            <Input label="Client" value={missionForm.client} onChange={(e) => setMissionForm({...missionForm, client: e.target.value})} required />
            <Input label="Localisation" value={missionForm.location} onChange={(e) => setMissionForm({...missionForm, location: e.target.value})} required />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input label="Date début" type="date" value={missionForm.startDate} onChange={(e) => setMissionForm({...missionForm, startDate: e.target.value})} required />
              <Input label="Date fin" type="date" value={missionForm.endDate} onChange={(e) => setMissionForm({...missionForm, endDate: e.target.value})} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Statut</label>
                <select value={missionForm.status} onChange={(e) => setMissionForm({...missionForm, status: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                  <option value="planifiee">Planifiée</option>
                  <option value="en_cours">En cours</option>
                  <option value="terminee">Terminée</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Priorité</label>
                <select value={missionForm.priority} onChange={(e) => setMissionForm({...missionForm, priority: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                  <option value="haute">Haute</option>
                  <option value="moyenne">Moyenne</option>
                  <option value="basse">Basse</option>
                </select>
              </div>
            </div>

            <Input label="Heures estimées" type="number" value={missionForm.hours} onChange={(e) => setMissionForm({...missionForm, hours: parseInt(e.target.value) || 0})} required />

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>👥 Techniciens</label>
              {selectedTeam?.memberIds?.length > 0 ? (
                <>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '1rem', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#f9fafb' }}>
                    {selectedTeam.memberIds.map(id => {
                      const user = getUserById(id);
                      const isChecked = missionForm.assignedTo.includes(id);
                      return (
                        <label key={id} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', margin: '0.25rem 0', backgroundColor: isChecked ? '#e0f2fe' : 'transparent', borderRadius: '4px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={isChecked} onChange={(e) => {
                            if (e.target.checked) {
                              setMissionForm({ ...missionForm, assignedTo: [...missionForm.assignedTo, id] });
                            } else {
                              setMissionForm({ ...missionForm, assignedTo: missionForm.assignedTo.filter(aid => aid !== id) });
                            }
                          }} style={{ marginRight: '10px' }} />
                          <div>
                            <strong>{user?.username}</strong>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{user?.email}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                    {missionForm.assignedTo.length} sélectionné(s)
                  </p>
                </>
              ) : (
                <div style={{ padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '4px', color: '#991b1b', textAlign: 'center' }}>
                  ⚠️ Cette équipe n'a aucun technicien.
                </div>
              )}
            </div>

            <Input label="Description" textarea value={missionForm.description} onChange={(e) => setMissionForm({...missionForm, description: e.target.value})} rows="3" />

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button variant="outline" onClick={() => setShowAddMissionModal(false)}>Annuler</Button>
              <Button type="submit" variant="primary" disabled={selectedTeam?.memberIds?.length === 0}>Ajouter</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ===== MODAL D'AJOUT DE MATÉRIEL AVEC IMAGE ===== */}
      {showAddMaterielModal && selectedTeam && (
        <Modal
          isOpen={showAddMaterielModal}
          onClose={() => setShowAddMaterielModal(false)}
          title={`Ajouter du matériel à ${selectedTeam.name}`}
        >
          <form onSubmit={(e) => { e.preventDefault(); handleAddMateriel(); }}>
            <Input
              label="Nom de l'équipement *"
              value={materielForm.name}
              onChange={(e) => setMaterielForm({...materielForm, name: e.target.value})}
              required
            />

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                Type de matériel
              </label>
              <select
                value={materielForm.type}
                onChange={(e) => setMaterielForm({...materielForm, type: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px'
                }}
              >
                <option value="equipement">Équipement physique</option>
                <option value="balise">Balise GPS</option>
                <option value="logiciel">Logiciel</option>
                <option value="systeme">Système</option>
                <option value="antenne">Antenne</option>
                <option value="câble">Câble</option>
                <option value="composant">Composant</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Modèle"
                value={materielForm.modele}
                onChange={(e) => setMaterielForm({...materielForm, modele: e.target.value})}
              />
              <Input
                label="Référence *"
                value={materielForm.reference}
                onChange={(e) => setMaterielForm({...materielForm, reference: e.target.value})}
                required
              />
            </div>

            <Input
              label="Fournisseur"
              value={materielForm.fournisseur}
              onChange={(e) => setMaterielForm({...materielForm, fournisseur: e.target.value})}
            />

            <Input
              label="Quantité"
              type="number"
              min="1"
              value={materielForm.quantite}
              onChange={(e) => setMaterielForm({...materielForm, quantite: parseInt(e.target.value) || 1})}
            />

            <Input
              label="Description"
              textarea
              value={materielForm.description}
              onChange={(e) => setMaterielForm({...materielForm, description: e.target.value})}
              rows="2"
            />

            {/* ===== CHAMP POUR L'IMAGE ===== */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                Image de l'équipement
              </label>
              <select
                value={materielForm.image}
                onChange={(e) => setMaterielForm({...materielForm, image: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px'
                }}
              >
                <option value="">Sélectionner une image...</option>
                <option value={img1}>ICOM IC-F8101 (Émetteur radio)</option>
              </select>
              {materielForm.image && (
                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                  <img 
                    src={materielForm.image} 
                    alt="Aperçu"
                    style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '4px' }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button variant="outline" onClick={() => setShowAddMaterielModal(false)}>Annuler</Button>
              <Button type="submit" variant="primary">Ajouter le matériel</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default TeamsPage;