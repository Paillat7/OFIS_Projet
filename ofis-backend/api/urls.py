from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from . import views
from .serializers import CustomTokenObtainPairSerializer

# Vue personnalisée pour le login
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

router = DefaultRouter()
router.register(r'reports', views.ReportViewSet, basename='report')
router.register(r'generated-reports', views.GeneratedReportViewSet, basename='generated-report')
router.register(r'services', views.ServiceViewSet)
router.register(r'equipment', views.EquipmentViewSet)
router.register(r'missions-v2', views.MissionV2ViewSet)
router.register(r'bons', views.BonDeCommandeViewSet)
router.register(r'rapports-journaliers', views.RapportJournalierViewSet)
# L'ancien rapport hebdomadaire n'existe plus → on commente la ligne
# router.register(r'rapports-hebdomadaires', views.RapportHebdomadaireViewSet, basename='rapport-hebdomadaire')

router.register(r'rapports-projet-cadre', views.RapportProjetCadreViewSet, basename='rapportprojetcadre')
router.register(r'rapports-hebdo-cadre', views.RapportHebdoCadreViewSet, basename='rapporthebdo')
router.register(r'suivi-medical', views.SuiviMedicalViewSet)
router.register(r'ordres-travail', views.OrdreTravailViewSet)
router.register(r'suivis-ot', views.SuiviOTViewSet, basename='suivi-ot')

urlpatterns = [
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('clients/', views.ClientListCreate.as_view(), name='client-list'),
    path('clients/<int:pk>/', views.ClientRetrieveUpdateDestroy.as_view(), name='client-detail'),
    path('technicians/', views.TechnicianListCreate.as_view(), name='technician-list'),
    path('managers/', views.ManagerListCreate.as_view(), name='manager-list'),
    path('missions/', views.MissionListCreate.as_view(), name='mission-list'),
    path('missions/<int:pk>/', views.MissionRetrieveUpdateDestroy.as_view(), name='mission-detail'),
    path('', include(router.urls)),
    path('upload/', views.ReportUploadView.as_view(), name='report-upload'),
    path('delete/<int:pk>/', views.ReportDeleteView.as_view(), name='report-delete'),
    path('teams/', views.TeamListCreate.as_view(), name='team-list'),
    path('teams/<int:pk>/', views.TeamRetrieveUpdateDestroy.as_view(), name='team-detail'),
    path('users/', views.UserListCreate.as_view(), name='user-list'),
    path('users/<int:pk>/', views.UserRetrieveUpdateDestroy.as_view(), name='user-detail'),
    path('positions/', views.PositionListCreateView.as_view(), name='position-list'),
    path('positions/team/<int:team_id>/latest/', views.TeamLatestPositionView.as_view(), name='team-latest'),
    path('admin/tables/', views.AdminTablesView.as_view(), name='admin-tables'),
    path('admin/backup/', views.AdminBackupView.as_view(), name='admin-backup'),
    path('admin/restore/', views.AdminRestoreView.as_view(), name='admin-restore'),
    path('admin/optimize/', views.AdminOptimizeView.as_view(), name='admin-optimize'),
    path('admin/backups/', views.AdminBackupHistoryView.as_view(), name='admin-backups'),
    path('admin/table/<str:table_name>/', views.AdminTableView.as_view(), name='admin-table'),
    path('admin/table/<str:table_name>/export/', views.AdminTableExportView.as_view(), name='admin-table-export'),
    path('dashboard/stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    path('hello/', views.hello_world, name='hello-world'),
]