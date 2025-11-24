"""
Простий скрипт для тестування підключення до SMTP Gmail
"""
import smtplib
from email.mime.text import MIMEText

# Налаштування з .env
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'stasfxreplay02@gmail.com'
EMAIL_HOST_PASSWORD = 'whegqfygthxygure'  # Без пробілів
DEFAULT_FROM_EMAIL = 'stasfxreplay02@gmail.com'

def test_smtp_connection():
    """Тестує підключення до SMTP сервера"""
    print("=" * 50)
    print("Тест підключення до SMTP Gmail")
    print("=" * 50)
    print(f"Host: {EMAIL_HOST}")
    print(f"Port: {EMAIL_PORT}")
    print(f"TLS: {EMAIL_USE_TLS}")
    print(f"User: {EMAIL_HOST_USER}")
    print(f"Password: {'*' * len(EMAIL_HOST_PASSWORD)}")
    print()
    
    try:
        print("1. Підключення до SMTP сервера...")
        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=30)
        print("   [OK] Підключення успішне")
        
        print("2. Включення TLS...")
        if EMAIL_USE_TLS:
            server.starttls()
            print("   [OK] TLS увімкнено")
        
        print("3. Авторизація...")
        server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
        print("   [OK] Авторизація успішна")
        
        print("4. Тестова відправка email...")
        msg = MIMEText("Це тестовий email для перевірки налаштувань.")
        msg['Subject'] = 'Тест відправки email'
        msg['From'] = DEFAULT_FROM_EMAIL
        msg['To'] = EMAIL_HOST_USER  # Відправляємо собі
        
        server.send_message(msg)
        print("   [OK] Email відправлено успішно!")
        
        server.quit()
        print()
        print("=" * 50)
        print("[OK] ВСЕ ПРАЦЮЄ! Перевірте пошту.")
        print("=" * 50)
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"   [ERROR] Помилка авторизації: {e}")
        print()
        print("Можливі причини:")
        print("- Неправильний пароль додатку")
        print("- Двофакторна аутентифікація не увімкнена")
        print("- Пароль додатку не створено")
        return False
        
    except (smtplib.SMTPConnectError, TimeoutError, OSError) as e:
        print(f"   [ERROR] Помилка підключення: {e}")
        print()
        print("Можливі причини:")
        print("- Файрвол блокує з'єднання (найімовірніше)")
        print("- Антивірус блокує з'єднання")
        print("- Провайдер блокує порт 587")
        print("- Проблеми з інтернет-з'єднанням")
        print()
        print("Рішення:")
        print("1. Дозвольте Python/вашому додатку в файрволі")
        print("2. Спробуйте вимкнути антивірус тимчасово")
        print("3. Спробуйте використати VPN")
        print("4. Спробуйте порт 465 з SSL (замість 587 з TLS)")
        return False
        
    except Exception as e:
        print(f"   [ERROR] Помилка: {e}")
        print(f"   Тип помилки: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_smtp_connection()

