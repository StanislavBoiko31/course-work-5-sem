from django.shortcuts import render
from rest_framework import viewsets
from .models import Photographer
from .serializers import PhotographerShortSerializer as PhotographerSerializer
from rest_framework import generics
from .models import Photographer
from .serializers import PhotographerSerializer
from users.views import IsAdminPermission
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from .serializers import PhotographerUpdateSerializer
from rest_framework.permissions import IsAuthenticated

# Create your views here.

class PhotographerViewSet(viewsets.ModelViewSet):
    queryset = Photographer.objects.all().order_by('id')
    serializer_class = PhotographerSerializer

    def get_queryset(self):
        return Photographer.objects.filter(user__is_active=True).order_by('user__email')

class PhotographerListView(generics.ListAPIView):
    queryset = Photographer.objects.all().order_by('user__email')
    serializer_class = PhotographerSerializer

class PhotographerDetailView(generics.RetrieveAPIView):
    queryset = Photographer.objects.all()
    serializer_class = PhotographerSerializer

class PhotographerAdminViewSet(viewsets.ModelViewSet):
    queryset = Photographer.objects.all().order_by('user__email')
    serializer_class = PhotographerSerializer
    permission_classes = [IsAdminPermission]

    @action(detail=True, methods=['patch'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        photographer = self.get_object()
        user = photographer.user
        user.is_active = not user.is_active
        user.save()
        return Response({'is_active': user.is_active})

class PhotographerMeView(generics.RetrieveUpdateAPIView):
    serializer_class = PhotographerUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user = self.request.user
        try:
            return Photographer.objects.get(user=user)
        except Photographer.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Photographer profile not found for this user.")
