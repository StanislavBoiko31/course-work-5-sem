"""
Тест відправки email через Django налаштування
"""
import os
import django

# Налаштування Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studio.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_django_email():
    """Тестує відправку email через Django"""
    print("=" * 50)
    print("Тест відправки email через Django")
    print("=" * 50)
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"EMAIL_USE_SSL: {settings.EMAIL_USE_SSL}")
    print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    print()
    
    try:
        print("Відправка тестового email...")
        send_mail(
            subject='Тест відправки email через Django',
            message='Це тестовий email для перевірки налаштувань Django.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.EMAIL_HOST_USER],
            fail_silently=False,
        )
        print()
        print("=" * 50)
        print("[OK] Email відправлено успішно!")
        print("Перевірте пошту:", settings.EMAIL_HOST_USER)
        print("=" * 50)
        return True
        
    except Exception as e:
        print()
        print("=" * 50)
        print(f"[ERROR] Помилка відправки: {e}")
        print(f"Тип помилки: {type(e).__name__}")
        print("=" * 50)
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_django_email()

