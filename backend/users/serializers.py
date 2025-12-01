from rest_framework import serializers
from .models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id", "email", "first_name", "last_name",
            "personal_discount", "profile_image", "password", "role", "is_active"
        )
        extra_kwargs = {
            "password": {"write_only": True, "required": False},
            "profile_image": {"required": False, "allow_null": True},
            "role": {"required": False},
        }

    def update(self, instance, validated_data):
        print("validated_data:", validated_data)
        password = validated_data.pop("password", None)
        profile_image = validated_data.pop("profile_image", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        if profile_image:
            instance.profile_image = profile_image
        instance.save()
        return instance

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'
    
    def validate(self, attrs):
        try:
            data = super().validate(attrs)
            return data
        except Exception as e:
            # Покращена обробка помилок автентифікації
            from rest_framework import serializers
            raise serializers.ValidationError({
                'detail': 'Невірний email або пароль. Перевірте правильність введених даних.'
            })
