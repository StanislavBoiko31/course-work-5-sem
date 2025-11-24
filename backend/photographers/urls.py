from django.urls import path
from .views import PhotographerListView, PhotographerDetailView, PhotographerAdminViewSet, PhotographerMeView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'admin', PhotographerAdminViewSet, basename='photographer-admin')

urlpatterns = [
    path('', PhotographerListView.as_view(), name='photographer-list'),
    path('me/', PhotographerMeView.as_view(), name='photographer-me'),
    path('<int:pk>/', PhotographerDetailView.as_view(), name='photographer-detail'),
]
urlpatterns += router.urls
