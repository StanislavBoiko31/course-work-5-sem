from rest_framework import serializers
from .models import Portfolio, HomePageContent
from photographers.serializers import PhotographerSerializer
from services.serializers import ServiceSerializer
from services.models import Service
from photographers.models import Photographer

class PortfolioSerializer(serializers.ModelSerializer):
    service_obj = ServiceSerializer(source='service', read_only=True)
    photographer_obj = PhotographerSerializer(source='photographer', read_only=True)
    service = serializers.PrimaryKeyRelatedField(queryset=Service.objects.all(), required=True)
    photographer = serializers.PrimaryKeyRelatedField(queryset=Photographer.objects.all(), required=False)

    class Meta:
        model = Portfolio
        fields = '__all__'


class HomePageContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomePageContent
        fields = '__all__' 