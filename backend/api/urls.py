"""
URL routing for Mind Status API.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import OrganizationViewSet, UserViewSet, StatusLogViewSet

# REST Framework Router
router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'users', UserViewSet, basename='user')
router.register(r'status', StatusLogViewSet, basename='status')

urlpatterns = [
    # JWT認証エンドポイント
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # REST API
    path('', include(router.urls)),
]
