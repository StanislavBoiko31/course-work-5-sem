"""
URL configuration for studio project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from photographers.views import PhotographerViewSet
from services.views import ServiceViewSet, AdditionalServiceViewSet
from portfolio.views import PortfolioViewSet
from bookings.views import BookingViewSet
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from users.views import UserCreateView

router = routers.DefaultRouter()
# router.register(r'photographers', PhotographerViewSet)  # Видаляємо, бо використовуємо кастомні URL-и
router.register(r'services', ServiceViewSet)
router.register(r'additional-services', AdditionalServiceViewSet)
#router.register(r'portfolio', PortfolioViewSet)
#router.register(r'bookings', BookingViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += [
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
urlpatterns += [
    path('api/register/', UserCreateView.as_view(), name='user-register'),
]

urlpatterns += [
    path('api/services/', include('services.urls')),
    path('api/photographers/', include('photographers.urls')),
    path('api/bookings/', include('bookings.urls')),
]
urlpatterns += [
    path('api/', include('users.urls')),
]

urlpatterns += [
    path('api/portfolio/', include('portfolio.urls')),
]
