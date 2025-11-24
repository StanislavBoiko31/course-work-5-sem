# Налаштування Email для відправки результатів фотосесії

## Швидкий старт

### 1. Створіть файл `.env`

Скопіюйте `env.example` в `.env`:

```bash
cd backend
copy env.example .env
```

### 2. Налаштуйте email

Відкрийте `.env` та заповніть свої дані:

**Для тестування (email виводиться в консоль):**
```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

**Для реальної відправки через Gmail:**
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
BASE_URL=http://localhost:8000
```

### 3. Для Gmail - створіть Пароль додатку

1. Перейдіть в [Google Account Settings](https://myaccount.google.com/)
2. Оберіть "Безпека" → "Двофакторна аутентифікація"
3. Увімкніть двофакторну аутентифікацію (якщо не увімкнена)
4. Перейдіть в "Паролі додатків"
5. Створіть новий пароль додатку для "Пошта"
6. Використайте цей пароль в `EMAIL_HOST_PASSWORD`

### 4. Тестування

Запустіть тестовий скрипт:

```bash
python test_email.py
```

Або перевірте автоматичну відправку:
1. Створіть замовлення як незареєстрований користувач
2. Завантажте результати (фото/відео)
3. Змініть статус на "Завершено"
4. Email відправиться автоматично

## API Endpoint

**POST** `/api/bookings/<booking_id>/send_results_email/`

**Запит:**
```json
{
  "email": "client@example.com"  // опціонально
}
```

**Відповідь:**
```json
{
  "detail": "Результати успішно відправлено на email"
}
```

## Автоматична відправка

Email автоматично відправляється при зміні статусу замовлення на "Завершено" для незареєстрованих користувачів (якщо є `guest_email` та результати).

## Структура email

Email містить:
- Привітання з ім'ям клієнта
- Дату фотосесії
- Список посилань на фото
- Список посилань на відео
- Підпис від команди студії

## Troubleshooting

### Email не відправляється

1. Перевірте налаштування в `.env`
2. Для Gmail переконайтеся, що використовуєте "Пароль додатку"
3. Перевірте логи сервера на наявність помилок
4. Спробуйте консольний backend для тестування

### Посилання не працюють

1. Перевірте `BASE_URL` в `.env`
2. Для production змініть на ваш домен
3. Переконайтеся, що файли доступні через веб-сервер

