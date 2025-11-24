"""
Скрипт для виведення всіх користувачів з їх ролями та email.
Запустіть: python manage.py shell < show_users.py
Або: python manage.py shell, потім скопіюйте код всередину.
"""

import os
import django

# Налаштування Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studio.settings')
django.setup()

from users.models import User

print("\n" + "="*60)
print("СПИСОК ВСІХ КОРИСТУВАЧІВ")
print("="*60)

users = User.objects.all().order_by('id')

if not users.exists():
    print("\n❌ Користувачів не знайдено!")
    print("\n💡 Створіть користувачів через Django команди:")
    print("   python manage.py createsuperuser")
    print("   або використайте скрипт create_users.py")
else:
    print(f"\n📊 Знайдено користувачів: {users.count()}\n")
    
    for user in users:
        role_emoji = {
            'admin': '👑',
            'photographer': '📸',
            'user': '👤'
        }.get(user.role, '❓')
        
        status = "✅ Активний" if user.is_active else "❌ Неактивний"
        staff = "🔧 Staff" if user.is_staff else ""
        superuser = "⭐ Superuser" if user.is_superuser else ""
        
        print(f"{role_emoji} ID: {user.id}")
        print(f"   Email: {user.email}")
        print(f"   Ім'я: {user.first_name} {user.last_name}")
        print(f"   Роль: {user.role}")
        print(f"   Статус: {status} {staff} {superuser}")
        print(f"   Знижка: {user.personal_discount}%")
        print("-" * 60)

print("\n" + "="*60)
print("💡 ЩОБ СКИНУТИ ПАРОЛЬ:")
print("="*60)
print("1. Запустіть: python manage.py shell")
print("2. Виконайте:")
print("   from users.models import User")
print("   user = User.objects.get(email='EMAIL_КОРИСТУВАЧА')")
print("   user.set_password('НОВИЙ_ПАРОЛЬ')")
print("   user.save()")
print("\n💡 ЩОБ СТВОРИТИ НОВОГО КОРИСТУВАЧА:")
print("   python manage.py createsuperuser")
print("   або використайте скрипт create_users.py")
print("="*60 + "\n")

