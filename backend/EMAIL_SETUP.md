# Налаштування Email для відправки результатів фотосесії

## Опис
Система автоматично відправляє результати фотосесії (фото та відео) на email незареєстрованим користувачам при завершенні замовлення.

## Налаштування

### 1. Для Gmail

Додайте в `.env` файл або встановіть змінні оточення:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password  # Пароль додатку, не звичайний пароль!
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

**Важливо для Gmail:**
- Потрібно створити "Пароль додатку" (App Password) в налаштуваннях Google Account
- Звичайний пароль не працюватиме через двофакторну аутентифікацію

### 2. Для інших SMTP серверів

```bash
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587  # або 465 для SSL
EMAIL_USE_TLS=True  # або False для SSL
EMAIL_HOST_USER=your-email@your-domain.com
EMAIL_HOST_PASSWORD=your-password
DEFAULT_FROM_EMAIL=your-email@your-domain.com
```

### 3. Для тестування (консоль)

Якщо не налаштовано SMTP, email буде виводитися в консоль:

```python
# В settings.py для розробки:
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

## Використання

### Автоматична відправка
Email автоматично відправляється при зміні статусу замовлення на "Завершено" для незареєстрованих користувачів.

### Ручна відправка через API

**Endpoint:** `POST /api/bookings/<booking_id>/send_results_email/`

**Запит:**
```json
{
  "email": "client@example.com"  // опціонально, якщо не вказано - використовується email з бронювання
}
```

**Відповідь:**
```json
{
  "detail": "Результати успішно відправлено на email"
}
```

**Права доступу:**
- Фотограф може відправляти тільки для своїх замовлень
- Адміністратор може відправляти для будь-яких замовлень

## Структура email

Email містить:
- Привітання з ім'ям клієнта
- Дату фотосесії
- Список посилань на фото
- Список посилань на відео
- Підпис від команди студії

## Примітки

- Посилання на файли формуються як `http://localhost:8000/media/...`
- Для production змініть `localhost:8000` на ваш домен
- Переконайтеся, що файли доступні через веб-сервер

