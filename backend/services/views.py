from django.shortcuts import render
from rest_framework import viewsets
from .models import Service, AdditionalService
from .serializers import ServiceSerializer, AdditionalServiceSerializer
from rest_framework import generics

# Create your views here.

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all().order_by('id')
    serializer_class = ServiceSerializer

class ServiceListView(generics.ListAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

class ServiceDetailView(generics.RetrieveAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

class AdditionalServiceViewSet(viewsets.ModelViewSet):
    queryset = AdditionalService.objects.all().order_by('id')
    serializer_class = AdditionalServiceSerializer
