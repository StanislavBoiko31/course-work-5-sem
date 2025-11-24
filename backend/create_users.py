"""
Скрипт для створення тестових користувачів.
Запустіть: python manage.py shell < create_users.py
АБО: python manage.py shell, потім скопіюйте код всередину.
"""

import os
import django

# Налаштування Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studio.settings')
django.setup()

from users.models import User

print("\n" + "="*60)
print("СТВОРЕННЯ ТЕСТОВИХ КОРИСТУВАЧІВ")
print("="*60)

# Перевірка чи користувачі вже існують
admin_email = "admin@studio.com"
photographer_email = "photographer@studio.com"
user_email = "user@studio.com"

# 1. Створення АДМІНА
if not User.objects.filter(email=admin_email).exists():
    admin = User.objects.create_user(
        email=admin_email,
        password="admin123",
        first_name="Адмін",
        last_name="Студії",
        role="admin",
        is_staff=True,
        is_superuser=True
    )
    print(f"✅ Створено АДМІНА:")
    print(f"   Email: {admin_email}")
    print(f"   Пароль: admin123")
else:
    admin = User.objects.get(email=admin_email)
    print(f"ℹ️  Адмін вже існує: {admin_email}")

# 2. Створення МАЙСТРА
if not User.objects.filter(email=photographer_email).exists():
    photographer = User.objects.create_user(
        email=photographer_email,
        password="photo123",
        first_name="Майстер",
        last_name="Фотограф",
        role="photographer",
        is_staff=False
    )
    print(f"\n✅ Створено МАЙСТРА:")
    print(f"   Email: {photographer_email}")
    print(f"   Пароль: photo123")
else:
    photographer = User.objects.get(email=photographer_email)
    print(f"\nℹ️  Майстер вже існує: {photographer_email}")

# 3. Створення КОРИСТУВАЧА
if not User.objects.filter(email=user_email).exists():
    user = User.objects.create_user(
        email=user_email,
        password="user123",
        first_name="Користувач",
        last_name="Тестовий",
        role="user",
        is_staff=False
    )
    print(f"\n✅ Створено КОРИСТУВАЧА:")
    print(f"   Email: {user_email}")
    print(f"   Пароль: user123")
else:
    user = User.objects.get(email=user_email)
    print(f"\nℹ️  Користувач вже існує: {user_email}")

print("\n" + "="*60)
print("📋 ПІДСУМОК ЛОГІНІВ ТА ПАРОЛІВ:")
print("="*60)
print(f"👑 АДМІН:")
print(f"   Email: {admin_email}")
print(f"   Пароль: admin123")
print(f"\n📸 МАЙСТЕР:")
print(f"   Email: {photographer_email}")
print(f"   Пароль: photo123")
print(f"\n👤 КОРИСТУВАЧ:")
print(f"   Email: {user_email}")
print(f"   Пароль: user123")
print("="*60 + "\n")

