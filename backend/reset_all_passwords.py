"""
Скрипт для скидання паролів всіх користувачів.
Встановлює пароль: Test_password2006.
Запустіть: python reset_all_passwords.py
"""

import os
import sys
import django

# Налаштування кодування для Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Додаємо поточну директорію до шляху
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Налаштування Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studio.settings')
django.setup()

from users.models import User

NEW_PASSWORD = "Test_password2006."

print("\n" + "="*70)
print("СКИДАННЯ ПАРОЛІВ ДЛЯ ВСІХ КОРИСТУВАЧІВ")
print("="*70)
print(f"\nНовий пароль для всіх: {NEW_PASSWORD}\n")

users = User.objects.all().order_by('id')

if not users.exists():
    print("[ПОМИЛКА] Користувачів не знайдено!")
else:
    print(f"Знайдено користувачів: {users.count()}\n")
    print("Оновлення паролів...\n")
    
    updated_count = 0
    for user in users:
        user.set_password(NEW_PASSWORD)
        user.save()
        updated_count += 1
        
        role_label = {
            'admin': '[АДМІН]',
            'photographer': '[МАЙСТЕР]',
            'user': '[КОРИСТУВАЧ]'
        }.get(user.role, '[НЕВІДОМО]')
        
        print(f"✅ {role_label} {user.email} - пароль оновлено")
    
    print("\n" + "="*70)
    print(f"✅ УСПІШНО! Оновлено паролі для {updated_count} користувачів")
    print("="*70)
    print(f"\nТепер всі користувачі можуть входити з паролем: {NEW_PASSWORD}")
    print("\n" + "="*70 + "\n")

