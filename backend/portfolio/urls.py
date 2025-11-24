from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import PortfolioViewSet, PortfolioMyViewSet, HomePageContentView

router = DefaultRouter()
router.register(r'my', PortfolioMyViewSet, basename='portfolio-my')
router.register(r'', PortfolioViewSet, basename='portfolio')

# Кастомні шляхи мають бути ПЕРЕД router.urls, щоб мати пріоритет
urlpatterns = [
    path('homepage-content/', HomePageContentView.as_view(), name='homepage-content'),
] + router.urls
