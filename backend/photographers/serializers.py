from rest_framework import serializers
from .models import Photographer
from users.serializers import UserSerializer
from services.serializers import ServiceSerializer
from services.models import Service

class PhotographerShortSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Photographer
        fields = ("id", "user", "photo")

class PhotographerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    services = ServiceSerializer(many=True, read_only=True)
    class Meta:
        model = Photographer
        fields = "__all__"

class PhotographerUpdateSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    services = serializers.PrimaryKeyRelatedField(queryset=Service.objects.all(), many=True)
    class Meta:
        model = Photographer
        fields = (
            "user", "bio", "phone", "photo", "services", "work_start", "work_end", "work_days"
        ) 