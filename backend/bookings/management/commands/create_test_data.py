from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from services.models import Service
from photographers.models import Photographer
from datetime import time

User = get_user_model()

class Command(BaseCommand):
    help = 'Create test data for the photo studio'

    def handle(self, *args, **options):
        self.stdout.write('Creating test data...')
        
        # Створюємо тестову послугу
        service, created = Service.objects.get_or_create(
            id=1,
            defaults={
                'name': 'Фотосесія',
                'description': 'Професійна фотосесія',
                'price': 1000,
                'duration': 60  # 60 хвилин
            }
        )
        if created:
            self.stdout.write(f'Created service: {service.name}')
        else:
            self.stdout.write(f'Service already exists: {service.name}')
        
        # Створюємо тестового користувача для фотографа
        user, created = User.objects.get_or_create(
            email='ivan@studio.com',
            defaults={
                'first_name': 'Іван',
                'last_name': 'Петренко',
                'is_staff': True
            }
        )
        if created:
            self.stdout.write(f'Created user: {user.first_name} {user.last_name}')
        else:
            self.stdout.write(f'User already exists: {user.first_name} {user.last_name}')
        
        # Створюємо тестового фотографа
        photographer, created = Photographer.objects.get_or_create(
            id=1,
            defaults={
                'user': user,
                'bio': 'Професійний фотограф з 5-річним досвідом',
                'phone': '+380991234567',
                'work_start': time(9, 0),  # 9:00
                'work_end': time(18, 0),   # 18:00
                'work_days': '0,1,2,3,4,5',  # Пн-Сб
            }
        )
        if created:
            self.stdout.write(f'Created photographer: {photographer.user.first_name} {photographer.user.last_name}')
        else:
            self.stdout.write(f'Photographer already exists: {photographer.user.first_name} {photographer.user.last_name}')
        
        self.stdout.write(self.style.SUCCESS('Test data created successfully!'))
        self.stdout.write(f'Service ID: {service.id}')
        self.stdout.write(f'Photographer ID: {photographer.id}') 