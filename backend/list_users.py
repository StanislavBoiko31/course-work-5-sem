"""
Скрипт для виведення всіх користувачів.
Запустіть: python list_users.py
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

print("\n" + "="*70)
print("СПИСОК ВСІХ КОРИСТУВАЧІВ")
print("="*70)

users = User.objects.all().order_by('id')

if not users.exists():
    print("\n[ПОМИЛКА] Користувачів не знайдено!")
    print("\n[ПІДКАЗКА] Створіть користувачів через:")
    print("   python manage.py createsuperuser")
    print("   або: python create_users.py")
else:
    print(f"\n📊 Знайдено користувачів: {users.count()}\n")
    
    for user in users:
        role_label = {
            'admin': '[АДМІН]',
            'photographer': '[МАЙСТЕР]',
            'user': '[КОРИСТУВАЧ]'
        }.get(user.role, '[НЕВІДОМО]')
        
        status = "[АКТИВНИЙ]" if user.is_active else "[НЕАКТИВНИЙ]"
        staff = "[STAFF]" if user.is_staff else ""
        superuser = "[SUPERUSER]" if user.is_superuser else ""
        
        print(f"{role_label} ID: {user.id}")
        print(f"   Email: {user.email}")
        print(f"   Ім'я: {user.first_name} {user.last_name}")
        print(f"   Роль: {user.role}")
        print(f"   Статус: {status} {staff} {superuser}")
        print(f"   Знижка: {user.personal_discount}%")
        print("-" * 70)

print("\n" + "="*70)
print("ВАЖЛИВО: Паролі зберігаються в хешованому вигляді!")
print("="*70)
print("\n[ПІДКАЗКА] ЩОБ СКИНУТИ ПАРОЛЬ:")
print("   1. Відредагуйте файл reset_password.py")
print("   2. Запустіть: python manage.py shell")
print("   3. Виконайте код з reset_password.py")
print("\n[ПІДКАЗКА] ЩОБ СТВОРИТИ НОВИХ КОРИСТУВАЧІВ З ВІДОМИМИ ПАРОЛЯМИ:")
print("   python create_users.py")
print("\n[ПІДКАЗКА] ШВИДКЕ СКИДАННЯ ПАРОЛЯ (через Django shell):")
print("   python manage.py shell")
print("   Потім виконайте:")
print("   from users.models import User")
print("   user = User.objects.get(email='EMAIL_КОРИСТУВАЧА')")
print("   user.set_password('НОВИЙ_ПАРОЛЬ')")
print("   user.save()")
print("="*70 + "\n")

