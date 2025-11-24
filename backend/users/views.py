from django.shortcuts import render
from rest_framework import generics, permissions
from .models import User
from .serializers import UserSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.generics import RetrieveUpdateAPIView, CreateAPIView

# Create your views here.

class UserCreateView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]  # <-- це обов'язково!

class UserMeView(RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class IsAdminPermission(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == 'admin')
