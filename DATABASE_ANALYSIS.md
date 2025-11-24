# Аналіз бази даних: Поточна vs Діаграма

## 📊 Порівняння

### На діаграмі:
- **Тип БД:** PostgreSQL Database
- **Що зберігає:**
  - Користувачі (users)
  - Фотографи (photographers)
  - Портфоліо (portfolio)
  - Замовлення (orders/bookings)
  - Розклад (schedules)

### Поточна реалізація:

#### ✅ Тип БД:
```python
# backend/studio/settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',  # ✅ PostgreSQL
        'NAME': 'studio_db',
        'USER': 'postgres',
        'PASSWORD': 'postgres',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```
**Відповідає діаграмі:** ✅ Так, використовується PostgreSQL

---

## 📋 Структура таблиць (моделі Django)

### 1. **Користувачі (Users)** ✅
**Модель:** `users.models.User`
```python
- email (EmailField, unique)
- first_name (CharField)
- last_name (CharField)
- personal_discount (DecimalField)
- profile_image (ImageField)
- role (CharField: user/photographer/admin)
- is_active, is_staff, is_superuser
```

**Відповідає діаграмі:** ✅ Так, зберігає користувачів

---

### 2. **Фотографи (Photographers)** ✅
**Модель:** `photographers.models.Photographer`
```python
- user (OneToOneField -> User)
- bio (TextField)
- phone (CharField)
- photo (ImageField)
- services (ManyToMany -> Service)
- work_start (TimeField)      # ✅ Розклад
- work_end (TimeField)        # ✅ Розклад
- work_days (CharField)       # ✅ Розклад (дні тижня)
```

**Відповідає діаграмі:** ✅ Так, зберігає фотографів та їх розклад

**Розклад:**
- `work_start` - час початку роботи
- `work_end` - час закінчення роботи
- `work_days` - дні тижня (наприклад: "0,1,2,3,4" = Пн-Пт)

---

### 3. **Портфоліо (Portfolio)** ✅
**Модель:** `portfolio.models.Portfolio`
```python
- photographer (ForeignKey -> Photographer)
- image (ImageField)
- description (TextField)
- service (ForeignKey -> Service)
```

**Додатково:** `portfolio.models.HomePageContent`
```python
- title, description
- contact_emails, contact_phones, contact_addresses (JSONField)
- is_active
```

**Відповідає діаграмі:** ✅ Так, зберігає портфоліо

---

### 4. **Замовлення (Bookings)** ✅
**Модель:** `bookings.models.Booking`
```python
- user (ForeignKey -> User, nullable)  # Для зареєстрованих
- photographer (ForeignKey -> Photographer)
- service (ForeignKey -> Service)
- date (DateField)
- start_time (TimeField)
- end_time (TimeField)
- status (CharField)
- guest_first_name, guest_last_name, guest_email  # Для гостей
- price (DecimalField)
- additional_services (ManyToMany -> AdditionalService)
- result_photos (JSONField)  # Результати фотосесії
- result_videos (JSONField)  # Результати відео
```

**Відповідає діаграмі:** ✅ Так, зберігає замовлення

---

### 5. **Послуги (Services)** ✅
**Модель:** `services.models.Service`
```python
- name (CharField)
- description (TextField)
- price (DecimalField)
- image (ImageField)
- duration (PositiveIntegerField)
```

**Додатково:** `services.models.AdditionalService`
```python
- name, description, price
```

**Відповідає діаграмі:** ✅ Так (неявно, бо потрібні для замовлень)

---

## 🔍 Детальне порівняння

### Що на діаграмі:
```
Database зберігає:
├── Користувачі ✅
├── Фотографи ✅
├── Портфоліо ✅
├── Замовлення ✅
└── Розклад ✅
```

### Що в поточній БД:
```
PostgreSQL Database:
├── users_user ✅ (користувачі)
├── photographers_photographer ✅ (фотографи)
│   └── Розклад: work_start, work_end, work_days ✅
├── portfolio_portfolio ✅ (портфоліо)
├── portfolio_homepagecontent ✅ (контент головної)
├── bookings_booking ✅ (замовлення)
├── services_service ✅ (послуги)
└── services_additionalservice ✅ (додаткові послуги)
```

---

## ✅ Висновок

### Відповідність діаграмі:

| Елемент діаграми | Поточна реалізація | Статус |
|-----------------|-------------------|--------|
| **PostgreSQL Database** | `django.db.backends.postgresql` | ✅ **Відповідає** |
| **Користувачі** | `users.User` | ✅ **Відповідає** |
| **Фотографи** | `photographers.Photographer` | ✅ **Відповідає** |
| **Портфоліо** | `portfolio.Portfolio` | ✅ **Відповідає** |
| **Замовлення** | `bookings.Booking` | ✅ **Відповідає** |
| **Розклад** | `Photographer.work_start/end/days` | ✅ **Відповідає** |

---

## 📝 Додаткові таблиці (не на діаграмі, але корисні):

1. **HomePageContent** - контент головної сторінки
2. **AdditionalService** - додаткові послуги
3. **Django системні таблиці:**
   - `auth_permission`
   - `django_migrations`
   - `django_content_type`
   - та інші

---

## 🎯 Висновок

**✅ База даних повністю відповідає діаграмі:**

1. **Тип БД:** PostgreSQL ✅
2. **Всі сутності з діаграми присутні:**
   - Користувачі ✅
   - Фотографи ✅
   - Портфоліо ✅
   - Замовлення ✅
   - Розклад ✅ (в моделі Photographer)

3. **Розклад реалізовано через:**
   - `work_start` - час початку роботи
   - `work_end` - час закінчення роботи
   - `work_days` - дні тижня (0=Пн, 6=Нд)

4. **Додаткові корисні таблиці:**
   - HomePageContent (контент головної)
   - AdditionalService (додаткові послуги)

**Все відповідає діаграмі! ✅**

---

## 💡 Примітки

1. **Розклад** на діаграмі показаний як окрема сутність, але в реалізації він є частиною моделі `Photographer`, що є логічним рішенням.

2. **Додаткові таблиці** (HomePageContent, AdditionalService) не показані на діаграмі, але це нормально - діаграма показує основні сутності, а деталі реалізації можуть відрізнятися.

3. **PostgreSQL** налаштований правильно і відповідає діаграмі.

