# Інструкція з налаштування відправки результатів на email

## Як це працює

Коли фотограф завантажує результати фотосесії і встановлює статус "Завершено", система **автоматично** відправляє email незареєстрованому користувачу (якщо він вказав email при створенні замовлення).

## Крок 1: Налаштування Gmail

### 1.1. Увімкніть двофакторну аутентифікацію
1. Відкрийте [Google Account](https://myaccount.google.com/)
2. Перейдіть в **Безпека** (Security)
3. Увімкніть **Двофакторну аутентифікацію** (2-Step Verification)

### 1.2. Створіть "Пароль додатку" (App Password)
1. В тому ж розділі **Безпека** знайдіть **Паролі додатків** (App passwords)
2. Натисніть **Створити** (Generate)
3. Оберіть **Пошта** (Mail) та **Інший** (Other) - введіть "Django Studio"
4. Скопіюйте згенерований 16-символьний пароль (виглядає як: `abcd efgh ijkl mnop`)

## Крок 2: Налаштування .env файлу

1. Відкрийте файл `backend/.env`
2. Заповніть наступні поля:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=ваш-email@gmail.com          # Ваш Gmail
EMAIL_HOST_PASSWORD=abcd efgh ijkl mnop      # Пароль додатку з кроку 1.2
DEFAULT_FROM_EMAIL=ваш-email@gmail.com       # Те саме, що і EMAIL_HOST_USER
BASE_URL=http://localhost:8000               # Для production змініть на ваш домен
```

**Важливо:** 
- Використовуйте **Пароль додатку**, а не звичайний пароль від Gmail
- Пароль додатку має 16 символів з пробілами (можна вводити з пробіками або без)

## Крок 3: Тестування

### Варіант 1: Тест через консоль (для розробки)
Тимчасово змініть в `.env`:
```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

При відправці email буде виводитися в консоль Django, а не відправлятися реально.

### Варіант 2: Тест реальної відправки
1. Запустіть Django сервер: `python manage.py runserver`
2. Створіть тестове замовлення як незареєстрований користувач (вкажіть email)
3. Увійдіть як фотограф
4. Завантажте результати і встановіть статус "Завершено"
5. Перевірте пошту клієнта

## Крок 4: Перевірка роботи

Після налаштування:
1. Фотограф завантажує результати через свій профіль
2. Встановлює статус "Завершено"
3. Система автоматично відправляє email на `guest_email` (якщо користувач не зареєстрований)
4. В email будуть посилання на всі фото та відео результати

## Альтернативні email провайдери

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

### Yahoo
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

### SendGrid (для production)
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=ваш-sendgrid-api-key
```

## Ручна відправка email

Також є API endpoint для ручної відправки:
```
POST /api/bookings/<booking_id>/send_results_email/
```

Це може використовуватися, якщо потрібно повторно відправити результати.

## Проблеми та рішення

### Помилка: "SMTPAuthenticationError"
- Перевірте, чи правильно вказано пароль додатку
- Переконайтеся, що двофакторна аутентифікація увімкнена

### Помилка: "Connection refused"
- Перевірте, чи правильно вказано `EMAIL_HOST` та `EMAIL_PORT`
- Перевірте інтернет-з'єднання

### Email не приходить
- Перевірте папку "Спам"
- Перевірте логи Django (в консолі сервера)
- Переконайтеся, що `guest_email` вказано правильно при створенні замовлення

