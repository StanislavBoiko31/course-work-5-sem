from rest_framework import serializers
from .models import Booking
from services.serializers import ServiceSerializer, AdditionalServiceSerializer
from photographers.serializers import PhotographerSerializer
from users.serializers import UserSerializer
from services.models import Service, AdditionalService
from photographers.models import Photographer
from datetime import datetime, timedelta

class BookingSerializer(serializers.ModelSerializer):
    service_obj = ServiceSerializer(source='service', read_only=True)
    user = UserSerializer(read_only=True)
    photographer = PhotographerSerializer(read_only=True)
    additional_services_data = AdditionalServiceSerializer(source='additional_services', many=True, read_only=True)
    # Додаємо поля для створення бронювання гостем
    service_id = serializers.PrimaryKeyRelatedField(queryset=Service.objects.all(), source="service", write_only=True, required=False)
    photographer_id = serializers.PrimaryKeyRelatedField(queryset=Photographer.objects.all(), source="photographer", write_only=True, required=False)
    additional_service_ids = serializers.PrimaryKeyRelatedField(queryset=AdditionalService.objects.all(), many=True, source="additional_services", write_only=True, required=False)

    class Meta:
        model = Booking
        fields = "__all__"
        read_only_fields = ("user", "end_time")
        extra_kwargs = {
            "guest_first_name": {"required": False},
            "guest_last_name": {"required": False},
            "guest_email": {"required": False},
            "price": {"required": False},
            "service": {"required": False},         # <-- ДОДАЙТЕ ЦЕ
            "photographer": {"required": False},    # <-- І ЦЕ
            "additional_services": {"required": False},
        }

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None

        # Дістаємо service і photographer з validated_data або з service_id/photographer_id
        service = validated_data.pop('service', None)
        photographer = validated_data.pop('photographer', None)

        # Якщо service або photographer не знайдені, спробуйте дістати їх з validated_data
        if not service and 'service_id' in validated_data:
            service = validated_data.pop('service_id')
        if not photographer and 'photographer_id' in validated_data:
            photographer = validated_data.pop('photographer_id')

        # Якщо все ще немає photographer або service — повертаємо помилку
        if not service or not photographer:
            raise serializers.ValidationError("Не вказано послугу або фотографа")

        # Обчислюємо end_time
        date = validated_data.get('date')
        start_time = validated_data.get('start_time')
        if date and start_time and service and hasattr(service, 'duration'):
            dt_start = datetime.combine(date, start_time)
            dt_end = dt_start + timedelta(minutes=service.duration)
            end_time = dt_end.time()
            validated_data['end_time'] = end_time
        else:
            validated_data['end_time'] = None

        # Обчислюємо ціну
        base_price = float(service.price)
        
        # Додаємо ціну додаткових послуг
        additional_services = validated_data.pop('additional_services', [])
        additional_price = sum(float(ads.price) for ads in additional_services)
        
        total_price = base_price + additional_price
        
        # Застосовуємо знижку (тільки для зареєстрованих користувачів)
        if user and hasattr(user, 'personal_discount'):
            discount = float(user.personal_discount or 0)
            price = total_price * (1 - discount / 100)
        else:
            price = total_price
        price = round(price, 2)
        validated_data['price'] = price

        booking = Booking.objects.create(user=user, service=service, photographer=photographer, **validated_data)
        
        # Додаємо додаткові послуги
        if additional_services:
            booking.additional_services.set(additional_services)
        
        return booking 