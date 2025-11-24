from rest_framework import serializers
from .models import Service, AdditionalService

class ServiceSerializer(serializers.ModelSerializer):
    photographers = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = "__all__"

    def get_photographers(self, obj):
        from photographers.serializers import PhotographerShortSerializer
        return PhotographerShortSerializer(obj.photographers.all(), many=True).data

class AdditionalServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdditionalService
        fields = "__all__" 