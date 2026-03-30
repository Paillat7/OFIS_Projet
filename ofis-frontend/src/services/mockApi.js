const mockApi = {
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // ===== AUTHENTIFICATION =====
  async login(credentials) {
    await this.delay(1000);
    
    const users = [
      { 
        id: 1, 
        name: 'Technicien Test', 
        email: 'technicien@ofis.cg',
        username: 'technicien',
        password: '123',
        role: 'employee',
        token: 'mock-jwt-token-employee'
      },
      { 
        id: 2, 
        name: 'Manager Test', 
        email: 'manager@ofis.cg',
        username: 'manager',
        password: '123',
        role: 'manager',
        token: 'mock-jwt-token-manager'
      },
      { 
        id: 3, 
        name: 'Admin Test', 
        email: 'admin@ofis.cg',
        username: 'admin',
        password: '123',
        role: 'admin',
        token: 'mock-jwt-token-admin'
      },
    ];

    // Accepte username OU email
    const user = users.find(u => 
      (u.username === credentials.username || u.email === credentials.username) && 
      u.password === credentials.password
    );

    if (user) {
      const { password, ...userWithoutPassword } = user;
      return {
        success: true,
        user: userWithoutPassword
      };
    }

    return { success: false, error: 'Identifiants incorrects' };
  },

  // ===== DASHBOARD =====
  async getDashboardStats(userId = 'admin') {
    await this.delay(600);
    
    const userStats = {
      technicien: { 
        total_missions: 5, 
        active_missions: 3, 
        monthly_hours: 85, 
        today_hours: 6.5,
        clients_active: 3, 
        teams_active: 1 
      },
      manager: { 
        total_missions: 15, 
        active_missions: 7, 
        monthly_hours: 342, 
        today_hours: 8.5,
        clients_active: 8, 
        teams_active: 3 
      },
      admin: { 
        total_missions: 25, 
        active_missions: 12, 
        monthly_hours: 850, 
        today_hours: 9.2,
        clients_active: 12, 
        teams_active: 5 
      }
    };
    
    return {
      data: userStats[userId] || userStats.technicien
    };
  },

  async getRecentMissions(userId = 'admin') {
    await this.delay(500);
    
    const missionsByUser = {
      technicien: [
        { id: 1, client: 'SNPC', title: 'Audit sécurité réseau', status: 'in_progress', start_date: '2024-01-15' },
        { id: 4, client: 'Baker Hughes', title: 'Installation serveurs', status: 'in_progress', start_date: '2024-01-18' },
      ],
      manager: [
        { id: 1, client: 'SNPC', title: 'Audit sécurité réseau', status: 'in_progress', start_date: '2024-01-15' },
        { id: 2, client: 'CORAF', title: 'Migration cloud', status: 'planned', start_date: '2024-01-20' },
        { id: 4, client: 'Baker Hughes', title: 'Installation serveurs', status: 'in_progress', start_date: '2024-01-18' },
      ],
      admin: [
        { id: 1, client: 'SNPC', title: 'Audit sécurité réseau', status: 'in_progress', start_date: '2024-01-15' },
        { id: 2, client: 'CORAF', title: 'Migration cloud', status: 'planned', start_date: '2024-01-20' },
        { id: 3, client: 'Perenco', title: 'Support télécom', status: 'completed', start_date: '2024-01-10' },
        { id: 4, client: 'Baker Hughes', title: 'Installation serveurs', status: 'in_progress', start_date: '2024-01-18' },
      ]
    };
    
    return {
      data: missionsByUser[userId] || missionsByUser.technicien
    };
  },

  async getWeeklyActivity(userId = 'admin') {
    await this.delay(400);
    
    const activityByUser = {
      technicien: [
        { day: 'Lun', hours: 7 },
        { day: 'Mar', hours: 6.5 },
        { day: 'Mer', hours: 5 },
        { day: 'Jeu', hours: 8 },
        { day: 'Ven', hours: 7.5 },
        { day: 'Sam', hours: 3 },
        { day: 'Dim', hours: 0 },
      ],
      manager: [
        { day: 'Lun', hours: 8 },
        { day: 'Mar', hours: 7.5 },
        { day: 'Mer', hours: 6 },
        { day: 'Jeu', hours: 9 },
        { day: 'Ven', hours: 8.5 },
        { day: 'Sam', hours: 4 },
        { day: 'Dim', hours: 0 },
      ],
      admin: [
        { day: 'Lun', hours: 9 },
        { day: 'Mar', hours: 8.5 },
        { day: 'Mer', hours: 7 },
        { day: 'Jeu', hours: 10 },
        { day: 'Ven', hours: 9.5 },
        { day: 'Sam', hours: 5 },
        { day: 'Dim', hours: 2 },
      ]
    };
    
    return {
      data: activityByUser[userId] || activityByUser.technicien
    };
  },

  // ===== MISSIONS =====
  async getMissions() {
    await this.delay(800);
    return {
      data: [
        { id: 1, client: 'SNPC', title: 'Audit sécurité réseau', status: 'in_progress' },
        { id: 2, client: 'CORAF', title: 'Migration cloud', status: 'planned' },
        { id: 3, client: 'Perenco', title: 'Support télécom', status: 'completed' },
      ]
    };
  },

  // ===== CLIENTS =====
  async getClients() {
    await this.delay(600);
    return {
      data: [
        { id: 1, name: 'SNPC', logo: null, missions_count: 5 },
        { id: 2, name: 'CORAF', logo: null, missions_count: 3 },
        { id: 3, name: 'Perenco', logo: null, missions_count: 8 },
      ]
    };
  },

  // ===== TIME TRACKING =====
  async startTimer(missionId) {
    await this.delay(300);
    return {
      success: true,
      data: {
        id: Date.now(),
        mission_id: missionId,
        start_time: new Date().toISOString()
      }
    };
  },

  async stopTimer(timerId) {
    await this.delay(300);
    return {
      success: true,
      data: {
        id: timerId,
        end_time: new Date().toISOString(),
        duration: 3600 // 1 heure en secondes
      }
    };
  }
};

export default mockApi;