"""
Тест підключення до SMTP Gmail через SSL (порт 465)
"""
import smtplib
from email.mime.text import MIMEText

EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 465  # SSL порт
EMAIL_HOST_USER = 'stasfxreplay02@gmail.com'
EMAIL_HOST_PASSWORD = 'whegqfygthxygure'
DEFAULT_FROM_EMAIL = 'stasfxreplay02@gmail.com'

def test_smtp_ssl():
    """Тестує підключення через SSL"""
    print("=" * 50)
    print("Тест підключення до SMTP Gmail (SSL порт 465)")
    print("=" * 50)
    
    try:
        print("1. Підключення через SSL...")
        server = smtplib.SMTP_SSL(EMAIL_HOST, EMAIL_PORT, timeout=30)
        print("   [OK] Підключення успішне")
        
        print("2. Авторизація...")
        server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
        print("   [OK] Авторизація успішна")
        
        print("3. Тестова відправка email...")
        msg = MIMEText("Це тестовий email для перевірки налаштувань (SSL).")
        msg['Subject'] = 'Тест відправки email (SSL)'
        msg['From'] = DEFAULT_FROM_EMAIL
        msg['To'] = EMAIL_HOST_USER
        
        server.send_message(msg)
        print("   [OK] Email відправлено успішно!")
        
        server.quit()
        print()
        print("=" * 50)
        print("[OK] ВСЕ ПРАЦЮЄ! Перевірте пошту.")
        print("=" * 50)
        print()
        print("Якщо це працює, змініть в .env:")
        print("EMAIL_PORT=465")
        print("EMAIL_USE_TLS=False")
        print("EMAIL_USE_SSL=True")
        return True
        
    except Exception as e:
        print(f"   [ERROR] Помилка: {e}")
        print(f"   Тип помилки: {type(e).__name__}")
        return False

if __name__ == "__main__":
    test_smtp_ssl()

