"""
Скрипт для тестування відправки email з результатами фотосесії.
Використання: python test_email.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studio.settings')
django.setup()

from bookings.models import Booking
from bookings.views import send_results_email

def test_email():
    """Тестує відправку email для незареєстрованого користувача"""
    
    # Знаходимо замовлення з результатами та guest_email
    bookings = Booking.objects.filter(
        guest_email__isnull=False
    ).exclude(guest_email='')
    
    bookings_with_results = [
        b for b in bookings 
        if (b.result_photos or b.result_videos)
    ]
    
    if not bookings_with_results:
        print("❌ Не знайдено замовлень з результатами та email незареєстрованого користувача")
        print("\nСтворіть тестове замовлення:")
        print("1. Створіть бронювання як незареєстрований користувач")
        print("2. Завантажте результати (фото/відео)")
        print("3. Запустіть цей скрипт знову")
        return
    
    print(f"Знайдено {len(bookings_with_results)} замовлень з результатами")
    print("\nОберіть замовлення для тестування:")
    
    for i, booking in enumerate(bookings_with_results, 1):
        print(f"{i}. ID: {booking.id}, Email: {booking.guest_email}, Дата: {booking.date}")
        print(f"   Фото: {len(booking.result_photos)}, Відео: {len(booking.result_videos)}")
    
    try:
        choice = int(input("\nВведіть номер замовлення (або 0 для виходу): "))
        if choice == 0:
            return
        
        if choice < 1 or choice > len(bookings_with_results):
            print("❌ Невірний вибір")
            return
        
        booking = bookings_with_results[choice - 1]
        
        # Запитуємо email для відправки (або використовуємо з бронювання)
        test_email = input(f"\nВведіть email для відправки (Enter для {booking.guest_email}): ").strip()
        recipient_email = test_email if test_email else booking.guest_email
        
        print(f"\n📧 Відправка email на {recipient_email}...")
        
        success = send_results_email(booking, recipient_email)
        
        if success:
            print("✅ Email успішно відправлено!")
        else:
            print("❌ Помилка відправки email")
            print("\nПеревірте:")
            print("1. Налаштування в .env файлі")
            print("2. Чи правильно налаштований SMTP сервер")
            print("3. Чи правильно вказані EMAIL_HOST_USER та EMAIL_HOST_PASSWORD")
            
    except ValueError:
        print("❌ Введіть число")
    except KeyboardInterrupt:
        print("\n\nСкасовано користувачем")
    except Exception as e:
        print(f"❌ Помилка: {e}")

if __name__ == "__main__":
    test_email()

