"""
Скрипт для скидання пароля користувача.
Запустіть: python manage.py shell < reset_password.py
АБО: python manage.py shell, потім скопіюйте код всередину.
"""

import os
import django

# Налаштування Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studio.settings')
django.setup()

from users.models import User

print("\n" + "="*60)
print("СКИДАННЯ ПАРОЛЯ КОРИСТУВАЧА")
print("="*60)

# ЗМІНІТЬ ЦІ ЗНАЧЕННЯ:
USER_EMAIL = "admin@studio.com"  # Email користувача
NEW_PASSWORD = "newpassword123"  # Новий пароль

try:
    user = User.objects.get(email=USER_EMAIL)
    user.set_password(NEW_PASSWORD)
    user.save()
    
    print(f"\n✅ Пароль успішно змінено!")
    print(f"   Email: {USER_EMAIL}")
    print(f"   Новий пароль: {NEW_PASSWORD}")
    print(f"   Роль: {user.role}")
except User.DoesNotExist:
    print(f"\n❌ Користувача з email '{USER_EMAIL}' не знайдено!")
    print("\n📋 Доступні користувачі:")
    for u in User.objects.all():
        print(f"   - {u.email} ({u.role})")

print("="*60 + "\n")

