from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from . import views

router = DefaultRouter()
router.register(r'projets', views.ProjetViewSet, basename='projet')
router.register(r'ordres-travail', views.OrdreTravailViewSet, basename='ordretravail')
router.register(r'rapports-journaliers', views.RapportJournalierViewSet, basename='rapportjournalier')
router.register(r'rapports-hebdo-cadre', views.RapportHebdoCadreViewSet, basename='rapporthebdocadre')
router.register(r'suivi-ot', views.SuiviOTViewSet, basename='suiviot')
router.register(r'documents-ot', views.DocumentOTViewSet, basename='documentot')
router.register(r'technicians', views.TechnicianViewSet, basename='technician')
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'tickets', views.TicketViewSet, basename='ticket')
router.register(r'agenda', views.AgendaTechnicienViewSet, basename='agenda')  # ← AJOUT

urlpatterns = [
    path('', include(router.urls)),
    path('clients/', views.ClientListCreate.as_view(), name='client-list'),
    path('clients/<int:pk>/', views.ClientRetrieveUpdateDestroy.as_view(), name='client-detail'),
    path('users/', views.UserListCreate.as_view(), name='user-list'),
    path('dashboard/stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    
    path('auth/login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('auth/test-login/', views.test_login, name='test_login'),
]