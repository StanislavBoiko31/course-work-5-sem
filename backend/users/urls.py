from django.urls import path
from .views import UserCreateView, UserMeView

urlpatterns = [
    path('register/', UserCreateView.as_view(), name='register'),
    path('auth/users/me/', UserMeView.as_view(), name='user-me'),
    path('auth/users/myprofile/', UserMeView.as_view(), name='user-myprofile'),  # ← цей рядок!
]
