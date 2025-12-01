from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListAPIView
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Booking
from .serializers import BookingSerializer
from services.models import Service
from photographers.models import Photographer
from datetime import datetime, timedelta, time, date as date_type
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from users.models import User
from rest_framework import status as drf_status
import os
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from decimal import Decimal
from django.core.mail import EmailMessage
from django.conf import settings
from django.urls import reverse

def increase_user_discount(booking):
    """
    Збільшує персональну знижку користувача на 0.5% при завершенні замовлення.
    Максимальна знижка - 10%.
    Працює тільки для зареєстрованих користувачів.
    """
    if not booking.user:
        return  # Гості не отримують знижку
    
    # Оновлюємо об'єкт user з бази даних, щоб отримати актуальне значення
    user = User.objects.get(pk=booking.user.pk)
    
    # Використовуємо Decimal для точності обчислень
    current_discount = Decimal(str(user.personal_discount or 0))
    discount_increase = Decimal('0.50')  # Точне значення 0.5% (використовуємо 0.50 для точності)
    max_discount = Decimal('10.00')
    
    # Збільшуємо знижку на 0.5%, але не більше 10%
    new_discount = min(current_discount + discount_increase, max_discount)
    
    # Перевіряємо, чи дійсно потрібно збільшити знижку
    # Додаткова перевірка: якщо різниця більше 0.5%, значить щось не так
    expected_increase = discount_increase
    actual_increase = new_discount - current_discount
    
    if new_discount > current_discount:
        # Перевіряємо, що збільшення точно 0.5%, а не більше
        if actual_increase > expected_increase:
            # Якщо збільшення більше 0.5%, обмежуємо його до 0.5%
            new_discount = current_discount + expected_increase
            new_discount = min(new_discount, max_discount)
        
        user.personal_discount = new_discount
        user.save(update_fields=['personal_discount'])
        # Оновлюємо об'єкт booking.user, щоб він відображав нове значення
        booking.user.refresh_from_db()
        return float(new_discount)  # Повертаємо нову знижку для можливого логування
    return float(current_discount)  # Повертаємо поточну знижку, якщо не змінилася

# Create your views here.

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

class MyBookingsView(ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).order_by('-date')

class BookingCreateView(generics.CreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        user = request.user if request.user.is_authenticated else None
        data = request.data.copy()
        service_id = data.get('service') or data.get('service_id')
        photographer_id = data.get('photographer') or data.get('photographer_id')
        date_str = data.get('date')
        start_time_str = data.get('start_time')

        # Для гостей перевіряємо додаткові поля
        if not user:
            guest_first_name = data.get('guest_first_name')
            guest_last_name = data.get('guest_last_name')
            guest_email = data.get('guest_email')
            if not all([guest_first_name, guest_last_name, guest_email]):
                return Response({"detail": "Ім'я, прізвище та email обов'язкові для гостей"}, status=status.HTTP_400_BAD_REQUEST)
            # Перевірка чи існує користувач з такою поштою
            if User.objects.filter(email=guest_email).exists():
                return Response({"detail": "Користувач з такою поштою вже зареєстрований. Будь ласка, увійдіть у свій акаунт для бронювання."}, status=status.HTTP_400_BAD_REQUEST)

        # Перевірка наявності всіх полів
        if not all([service_id, photographer_id, date_str, start_time_str]):
            return Response({"detail": "Всі поля обов'язкові"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            service = Service.objects.get(id=service_id)
            photographer = Photographer.objects.get(id=photographer_id)
        except (Service.DoesNotExist, Photographer.DoesNotExist):
            return Response({"detail": "Послуга або фотограф не знайдені"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            date = datetime.strptime(date_str, "%Y-%m-%d").date()
            start_time = datetime.strptime(start_time_str, "%H:%M").time()
        except Exception:
            return Response({"detail": "Невірний формат дати або часу"}, status=status.HTTP_400_BAD_REQUEST)

        duration = service.duration

        # Перевірка доступності
        is_available, reason = is_slot_available(photographer, date, start_time, duration)
        if not is_available:
            return Response({"detail": reason}, status=status.HTTP_400_BAD_REQUEST)

        # Обчислення end_time
        dt_start = datetime.combine(date, start_time)
        dt_end = dt_start + timedelta(minutes=duration)
        end_time = dt_end.time()

        # Обробка додаткових послуг
        additional_service_ids = data.get('additional_service_ids', [])
        if isinstance(additional_service_ids, str):
            # Якщо прийшов рядок, спробуємо розпарсити як JSON або список
            try:
                import json
                additional_service_ids = json.loads(additional_service_ids)
            except:
                additional_service_ids = [additional_service_ids] if additional_service_ids else []
        elif not isinstance(additional_service_ids, list):
            additional_service_ids = [additional_service_ids] if additional_service_ids else []
        
        # Отримуємо об'єкти додаткових послуг
        additional_services = []
        if additional_service_ids:
            try:
                from services.models import AdditionalService
                additional_services = AdditionalService.objects.filter(id__in=additional_service_ids)
            except Exception as e:
                return Response({"detail": f"Помилка обробки додаткових послуг: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        # Обчислення ціни з урахуванням знижки та додаткових послуг
        base_price = float(service.price)
        additional_price = sum(float(ads.price) for ads in additional_services)
        total_price = base_price + additional_price
        
        # Застосовуємо знижку до загальної суми (основна послуга + додаткові послуги)
        if user and hasattr(user, 'personal_discount'):
            discount = float(user.personal_discount or 0)
            price = total_price * (1 - discount / 100)
        else:
            price = total_price
        price = round(price, 2)

        booking = Booking.objects.create(
            user=user,
            photographer=photographer,
            service=service,
            date=date,
            start_time=start_time,
            end_time=end_time,
            status="Очікує підтвердження",
            guest_first_name=data.get('guest_first_name'),
            guest_last_name=data.get('guest_last_name'),
            guest_email=data.get('guest_email'),
            price=price,
        )
        
        # Додаємо додаткові послуги до бронювання
        if additional_services:
            booking.additional_services.set(additional_services)
        
        serializer = self.get_serializer(booking)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

def is_slot_available(photographer, date, start_time, duration):
    # 1. Перевірка дня тижня
    weekday = date.weekday()  # 0=Пн, 6=Нд
    allowed_days = [int(x) for x in photographer.work_days.split(",")]
    if weekday not in allowed_days:
        return False, "Фотограф не працює у цей день"

    # 2. Перевірка часу
    dt_start = datetime.combine(date, start_time)
    dt_end = dt_start + timedelta(minutes=duration)
    end_time = dt_end.time()
    if not (photographer.work_start <= start_time < photographer.work_end):
        return False, "Час початку поза робочим часом"
    if end_time > photographer.work_end:
        return False, "Час закінчення виходить за межі робочого дня"

    # 3. Перевірка, чи не минув час для сьогоднішніх бронювань
    today = date_type.today()
    if date == today:
        now = datetime.now()
        # Округлюємо поточний час до наступного 15-хвилинного інтервалу
        # Наприклад: 16:17 -> 16:30, 16:30 -> 16:45, 16:45 -> 17:00
        current_minute = now.minute
        rounded_minute = ((current_minute // 15) + 1) * 15
        if rounded_minute >= 60:
            rounded_hour = now.hour + 1
            rounded_minute = 0
        else:
            rounded_hour = now.hour
        min_available_time = time(rounded_hour, rounded_minute)
        
        if start_time < min_available_time:
            return False, "Неможливо забронювати час, який вже минув"

    # 4. Перевірка перетину з іншими бронюваннями
    bookings = Booking.objects.filter(
        photographer=photographer,
        date=date,
        start_time__lt=end_time,
        end_time__gt=start_time
    )
    if bookings.exists():
        return False, "Цей час вже зайнятий"

    return True, ""

class AvailableSlotsView(APIView):
    permission_classes = [AllowAny]  # або IsAuthenticated, якщо треба

    def get(self, request):
        photographer_id = request.query_params.get('photographer')
        service_id = request.query_params.get('service')
        date_str = request.query_params.get('date')
        print("DEBUG available_slots params:", photographer_id, service_id, date_str)

        if not all([photographer_id, service_id, date_str]):
            return Response({"detail": "photographer, service, date обов'язкові"}, status=400)

        try:
            photographer = Photographer.objects.get(id=photographer_id)
            service = Service.objects.get(id=service_id)
            date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except Exception:
            return Response({"detail": "Невірний id або формат дати"}, status=400)

        # Перевірка дня тижня
        weekday = date.weekday()
        allowed_days = [int(x) for x in photographer.work_days.split(",")]
        if weekday not in allowed_days:
            return Response({"slots": []})

        # Генеруємо всі можливі слоти
        duration = service.duration
        slots = []
        start = datetime.combine(date, photographer.work_start)
        end = datetime.combine(date, photographer.work_end)
        
        # Якщо дата - сьогодні, обчислюємо мінімальний доступний час
        today = date_type.today()
        min_available_time = None
        if date == today:
            now = datetime.now()
            # Округлюємо поточний час до наступного 15-хвилинного інтервалу
            current_minute = now.minute
            rounded_minute = ((current_minute // 15) + 1) * 15
            if rounded_minute >= 60:
                rounded_hour = now.hour + 1
                rounded_minute = 0
            else:
                rounded_hour = now.hour
            min_available_time = time(rounded_hour, rounded_minute)
        
        while start + timedelta(minutes=duration) <= end:
            slot_start = start.time()
            slot_end = (start + timedelta(minutes=duration)).time()
            
            # Пропускаємо слоти, які вже минули (для сьогодні)
            if min_available_time and slot_start < min_available_time:
                start += timedelta(minutes=15)
                continue
            
            # Перевірка перетину з бронюваннями
            overlap = Booking.objects.filter(
                photographer=photographer,
                date=date,
                start_time__lt=slot_end,
                end_time__gt=slot_start
            ).exists()
            if not overlap:
                slots.append(slot_start.strftime("%H:%M"))
            start += timedelta(minutes=15)  # крок, наприклад, 15 хвилин

        return Response({"slots": slots})

class AvailableDatesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        photographer_id = request.query_params.get('photographer')
        service_id = request.query_params.get('service')
        
        if not photographer_id:
            return Response({"detail": "photographer обов'язковий"}, status=400)
        
        try:
            photographer = Photographer.objects.get(id=photographer_id)
            if service_id:
                service = Service.objects.get(id=service_id)
                duration = service.duration
            else:
                duration = 60  # За замовчуванням 60 хвилин
        except Exception:
            return Response({"detail": "Невірний id"}, status=400)

        # Отримуємо робочі дні фотографа
        allowed_days = [int(x) for x in photographer.work_days.split(",")]
        
        # Генеруємо список доступних дат на наступні 3 місяці
        today = datetime.now().date()
        end_date = today + timedelta(days=90)
        available_dates = []
        
        current_date = today
        while current_date <= end_date:
            weekday = current_date.weekday()
            
            # Перевіряємо, чи це робочий день
            if weekday in allowed_days:
                # Перевіряємо, чи є хоча б один вільний слот у цей день
                # Генеруємо всі можливі слоти
                has_available_slot = False
                start = datetime.combine(current_date, photographer.work_start)
                end = datetime.combine(current_date, photographer.work_end)
                
                # Якщо дата - сьогодні, обчислюємо мінімальний доступний час
                min_available_time = None
                if current_date == today:
                    now = datetime.now()
                    # Округлюємо поточний час до наступного 15-хвилинного інтервалу
                    current_minute = now.minute
                    rounded_minute = ((current_minute // 15) + 1) * 15
                    if rounded_minute >= 60:
                        rounded_hour = now.hour + 1
                        rounded_minute = 0
                    else:
                        rounded_hour = now.hour
                    min_available_time = time(rounded_hour, rounded_minute)
                
                while start + timedelta(minutes=duration) <= end:
                    slot_start = start.time()
                    slot_end = (start + timedelta(minutes=duration)).time()
                    
                    # Пропускаємо слоти, які вже минули (для сьогодні)
                    if min_available_time and slot_start < min_available_time:
                        start += timedelta(minutes=15)
                        continue
                    
                    # Перевірка перетину з бронюваннями
                    overlap = Booking.objects.filter(
                        photographer=photographer,
                        date=current_date,
                        start_time__lt=slot_end,
                        end_time__gt=slot_start
                    ).exists()
                    
                    if not overlap:
                        has_available_slot = True
                        break
                    
                    start += timedelta(minutes=15)  # крок 15 хвилин
                
                if has_available_slot:
                    available_dates.append(current_date.strftime("%Y-%m-%d"))
            
            current_date += timedelta(days=1)
        
        return Response({"available_dates": available_dates})

class BookingUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    queryset = Booking.objects.all()

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return obj
        # Фотограф може редагувати свої замовлення
        if user.role == "photographer":
            try:
                photographer = Photographer.objects.get(user=user)
                if obj.photographer == photographer:
                    return obj
            except Photographer.DoesNotExist:
                pass
        # Користувач може редагувати свої замовлення тільки якщо статус "Очікує підтвердження"
        if obj.user == user and obj.status == "Очікує підтвердження":
            return obj
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Ви можете редагувати лише свої активні замовлення")

    def patch(self, request, *args, **kwargs):
        data = request.data.copy()
        user = self.request.user
        booking = self.get_object()
        
        # Видаляємо порожні рядки з даних, але залишаємо additional_service_ids (навіть порожній масив)
        data = {k: v for k, v in data.items() if (k == 'additional_service_ids' or (v != "" and v is not None))}
        
        # Якщо змінюється статус на підтверджено/скасовано — ставимо потрібний текст
        if "status" in data:
            if data["status"].lower().startswith("підтверджено"):
                data["status"] = "Підтверджено адміністратором"
            elif data["status"].lower().startswith("скасовано"):
                # Перевіряємо чи це не вже "Скасовано користувачем"
                if data["status"] != "Скасовано користувачем":
                    data["status"] = "Скасовано адміністратором"
            elif data["status"].lower() == "зроблено":
                # Тільки майстер може змінювати статус на "Зроблено" для своїх замовлень
                if user.role == "photographer":
                    try:
                        photographer = Photographer.objects.get(user=user)
                        if booking.photographer != photographer:
                            return Response({"detail": "Ви можете встановити статус 'Зроблено' тільки для своїх замовлень"}, status=drf_status.HTTP_403_FORBIDDEN)
                        data["status"] = "Зроблено"
                    except Photographer.DoesNotExist:
                        return Response({"detail": "Профіль фотографа не знайдено"}, status=drf_status.HTTP_404_NOT_FOUND)
                else:
                    return Response({"detail": "Тільки фотограф може встановити статус 'Зроблено'"}, status=drf_status.HTTP_403_FORBIDDEN)
            elif data["status"].lower() == "завершено":
                # Тільки фотограф може змінювати статус на "Завершено" і тільки якщо є результати
                if user.role == "photographer":
                    try:
                        photographer = Photographer.objects.get(user=user)
                        if booking.photographer != photographer:
                            return Response({"detail": "Ви можете встановити статус 'Завершено' тільки для своїх замовлень"}, status=drf_status.HTTP_403_FORBIDDEN)
                        # Перевіряємо чи є завантажені результати
                        if not booking.result_photos and not booking.result_videos:
                            return Response({"detail": "Спочатку завантажте результати роботи (фото або відео)"}, status=drf_status.HTTP_400_BAD_REQUEST)
                        
                        # Перевіряємо, чи статус вже не був "Завершено" (щоб не збільшувати знижку повторно)
                        old_status = booking.status
                        if old_status != "Завершено":
                            # Збільшуємо знижку користувача при першому завершенні замовлення
                            # Отримуємо актуальне значення знижки перед збільшенням
                            if booking.user:
                                old_discount = float(booking.user.personal_discount or 0)
                                increase_user_discount(booking)
                                # Перевіряємо, що знижка збільшилася правильно
                                booking.user.refresh_from_db()
                                new_discount = float(booking.user.personal_discount or 0)
                                print(f"DEBUG: Знижка змінена з {old_discount}% на {new_discount}% для користувача {booking.user.email}")
                            
                            # Автоматично відправляємо email незареєстрованому користувачу
                            if not booking.user and booking.guest_email:
                                try:
                                    send_results_email(booking)
                                except Exception as e:
                                    print(f"Помилка автоматичної відправки email: {e}")
                        
                        data["status"] = "Завершено"
                    except Photographer.DoesNotExist:
                        return Response({"detail": "Профіль фотографа не знайдено"}, status=drf_status.HTTP_404_NOT_FOUND)
                else:
                    return Response({"detail": "Тільки фотограф може встановити статус 'Завершено'"}, status=drf_status.HTTP_403_FORBIDDEN)
        
        # Обробка додаткових послуг та перерахунок ціни
        if 'additional_service_ids' in data:
            additional_service_ids = data.get('additional_service_ids', [])
            if isinstance(additional_service_ids, str):
                try:
                    import json
                    additional_service_ids = json.loads(additional_service_ids)
                except:
                    additional_service_ids = [additional_service_ids] if additional_service_ids else []
            elif not isinstance(additional_service_ids, list):
                # Якщо це не список, перетворюємо в список
                additional_service_ids = [additional_service_ids] if additional_service_ids else []
            
            # Фільтруємо порожні значення з масиву
            # Переконуємося, що additional_service_ids - це список перед ітерацією
            if not isinstance(additional_service_ids, list):
                additional_service_ids = [additional_service_ids] if additional_service_ids else []
            additional_service_ids = [id for id in additional_service_ids if id and str(id).strip()]
            
            from services.models import AdditionalService
            additional_services = AdditionalService.objects.filter(id__in=additional_service_ids) if additional_service_ids else []
            
            # Отримуємо поточну послугу (або нову, якщо змінюється)
            service = booking.service
            if 'service_id' in data and data['service_id']:
                try:
                    from services.models import Service
                    service_id = data['service_id']
                    # Перевіряємо, чи це не порожній рядок
                    if service_id and str(service_id).strip():
                        service = Service.objects.get(id=service_id)
                except (Service.DoesNotExist, ValueError):
                    pass
            
            # Перераховуємо ціну
            base_price = float(service.price)
            additional_price = sum(float(ads.price) for ads in additional_services)
            total_price = base_price + additional_price
            
            # Застосовуємо знижку до загальної суми
            booking_user = booking.user
            if booking_user and hasattr(booking_user, 'personal_discount'):
                discount = float(booking_user.personal_discount or 0)
                price = total_price * (1 - discount / 100)
            else:
                price = total_price
            data['price'] = round(price, 2)
        
        serializer = self.get_serializer(self.get_object(), data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        
        # Оновлюємо додаткові послуги
        if 'additional_service_ids' in data:
            additional_service_ids = data.get('additional_service_ids', [])
            if isinstance(additional_service_ids, str):
                try:
                    import json
                    additional_service_ids = json.loads(additional_service_ids)
                except:
                    additional_service_ids = [additional_service_ids] if additional_service_ids else []
            elif not isinstance(additional_service_ids, list):
                additional_service_ids = [additional_service_ids] if additional_service_ids else []
            
            # Фільтруємо порожні значення з масиву
            additional_service_ids = [id for id in additional_service_ids if id and str(id).strip()]
            
            from services.models import AdditionalService
            additional_services = AdditionalService.objects.filter(id__in=additional_service_ids) if additional_service_ids else []
            booking.additional_services.set(additional_services)
        
        return Response(serializer.data, status=drf_status.HTTP_200_OK)

from rest_framework import generics
from .models import Booking
from .serializers import BookingSerializer

class BookingListView(generics.ListAPIView):
    queryset = Booking.objects.all().order_by('-date')
    serializer_class = BookingSerializer
    # Додайте permissions, якщо потрібно (наприклад, IsAuthenticated)

from rest_framework import generics

class BookingListCreateView(generics.ListCreateAPIView):
    queryset = Booking.objects.all().order_by('-date')
    serializer_class = BookingSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class PhotographerBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role != "photographer":
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Доступ тільки для фотографів")
        
        try:
            photographer = Photographer.objects.get(user=user)
            return Booking.objects.filter(photographer=photographer).order_by('-date', '-start_time')
        except Photographer.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Профіль фотографа не знайдено")

class UploadBookingResultsView(APIView):
    """Ендпоінт для завантаження результатів роботи (фото/відео)"""
    permission_classes = [IsAuthenticated]

    def post(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({"detail": "Бронювання не знайдено"}, status=drf_status.HTTP_404_NOT_FOUND)

        user = request.user
        
        # Перевірка прав доступу
        if user.role != "photographer":
            return Response({"detail": "Тільки фотограф може завантажувати результати"}, status=drf_status.HTTP_403_FORBIDDEN)
        
        try:
            photographer = Photographer.objects.get(user=user)
            if booking.photographer != photographer:
                return Response({"detail": "Ви можете завантажувати результати тільки для своїх замовлень"}, status=drf_status.HTTP_403_FORBIDDEN)
        except Photographer.DoesNotExist:
            return Response({"detail": "Профіль фотографа не знайдено"}, status=drf_status.HTTP_404_NOT_FOUND)

        # Перевірка статусу
        if booking.status not in ["Підтверджено адміністратором", "Зроблено"]:
            return Response({"detail": "Результати можна завантажувати тільки для підтверджених або зроблених замовлень"}, status=drf_status.HTTP_400_BAD_REQUEST)

        # Обробка файлів
        photos = request.FILES.getlist('photos', [])
        videos = request.FILES.getlist('videos', [])
        
        if not photos and not videos:
            return Response({"detail": "Потрібно завантажити хоча б один файл"}, status=drf_status.HTTP_400_BAD_REQUEST)

        uploaded_photos = []
        uploaded_videos = []

        # Зберігаємо фото
        for photo in photos:
            if photo.content_type.startswith('image/'):
                file_path = default_storage.save(f'booking_results/{booking_id}/photos/{photo.name}', ContentFile(photo.read()))
                uploaded_photos.append(f'/media/{file_path}')
            else:
                return Response({"detail": f"Файл {photo.name} не є зображенням"}, status=drf_status.HTTP_400_BAD_REQUEST)

        # Зберігаємо відео
        for video in videos:
            if video.content_type.startswith('video/'):
                file_path = default_storage.save(f'booking_results/{booking_id}/videos/{video.name}', ContentFile(video.read()))
                uploaded_videos.append(f'/media/{file_path}')
            else:
                return Response({"detail": f"Файл {video.name} не є відео"}, status=drf_status.HTTP_400_BAD_REQUEST)

        # Оновлюємо бронювання
        booking.result_photos = list(booking.result_photos) + uploaded_photos
        booking.result_videos = list(booking.result_videos) + uploaded_videos
        booking.save()

        serializer = BookingSerializer(booking)
        return Response(serializer.data, status=drf_status.HTTP_200_OK)


def send_results_email(booking, recipient_email=None):
    """
    Відправляє email з результатами фотосесії незареєстрованому користувачу.
    Файли (фото та відео) додаються як вкладення до email.
    """
    if not booking.guest_email and not recipient_email:
        return False
    
    email_to = recipient_email or booking.guest_email
    
    # Перевіряємо, чи є результати для відправки
    if not booking.result_photos and not booking.result_videos:
        return False
    
    # Формуємо повідомлення
    subject = f"Результати фотосесії від {booking.photographer.user.first_name or booking.photographer.user.email}"
    
    # Формуємо текст повідомлення
    from django.conf import settings
    import os
    
    message_parts = [
        f"Вітаємо, {booking.guest_first_name or 'Шановний клієнте'}!",
        "",
        f"Ваша фотосесія від {booking.date} завершена.",
        "",
        "Результати роботи вкладені в цей email:",
    ]
    
    if booking.result_photos:
        message_parts.append(f"\nФото: {len(booking.result_photos)} файлів")
    
    if booking.result_videos:
        message_parts.append(f"Відео: {len(booking.result_videos)} файлів")
    
    message_parts.extend([
        "",
        "Дякуємо за вибір нашої студії!",
        "",
        "З повагою,",
        "Команда фотостудії"
    ])
    
    message = "\n".join(message_parts)
    
    try:
        import logging
        logger = logging.getLogger(__name__)
        
        # Логуємо налаштування (без пароля)
        logger.info(f"Відправка email на {email_to}")
        logger.info(f"EMAIL_HOST: {settings.EMAIL_HOST}")
        logger.info(f"EMAIL_PORT: {settings.EMAIL_PORT}")
        logger.info(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
        logger.info(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
        logger.info(f"EMAIL_USE_SSL: {getattr(settings, 'EMAIL_USE_SSL', False)}")
        
        email = EmailMessage(
            subject=subject,
            body=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email_to],
        )
        
        # Додаємо фото як вкладення
        if booking.result_photos:
            for photo_url in booking.result_photos:
                try:
                    # Отримуємо шлях до файлу (прибираємо /media/ з початку)
                    if photo_url.startswith('/media/'):
                        file_path = photo_url[7:]  # Прибираємо '/media/'
                    elif photo_url.startswith('media/'):
                        file_path = photo_url[6:]  # Прибираємо 'media/'
                    else:
                        file_path = photo_url
                    
                    # Використовуємо Path для правильного формування шляху
                    from pathlib import Path
                    full_path = Path(settings.MEDIA_ROOT) / file_path
                    full_path = str(full_path)
                    
                    logger.info(f"Шукаємо файл: {full_path}")
                    
                    # Перевіряємо, чи файл існує
                    if os.path.exists(full_path) and os.path.isfile(full_path):
                        # Отримуємо ім'я файлу для вкладення
                        filename = os.path.basename(file_path)
                        # Визначаємо тип контенту за розширенням
                        ext = os.path.splitext(filename)[1].lower()
                        if ext in ['.jpg', '.jpeg']:
                            content_type = 'image/jpeg'
                        elif ext == '.png':
                            content_type = 'image/png'
                        elif ext == '.gif':
                            content_type = 'image/gif'
                        elif ext == '.webp':
                            content_type = 'image/webp'
                        else:
                            content_type = 'image/jpeg'  # За замовчуванням
                        
                        with open(full_path, 'rb') as f:
                            file_content = f.read()
                            email.attach(filename, file_content, content_type)
                        logger.info(f"Додано фото як вкладення: {filename} ({len(file_content)} байт)")
                    else:
                        logger.warning(f"Файл не знайдено або не є файлом: {full_path}")
                except Exception as e:
                    logger.error(f"Помилка додавання фото {photo_url}: {e}", exc_info=True)
        
        # Додаємо відео як вкладення
        if booking.result_videos:
            for video_url in booking.result_videos:
                try:
                    # Отримуємо шлях до файлу (прибираємо /media/ з початку)
                    if video_url.startswith('/media/'):
                        file_path = video_url[7:]  # Прибираємо '/media/'
                    elif video_url.startswith('media/'):
                        file_path = video_url[6:]  # Прибираємо 'media/'
                    else:
                        file_path = video_url
                    
                    # Використовуємо Path для правильного формування шляху
                    from pathlib import Path
                    full_path = Path(settings.MEDIA_ROOT) / file_path
                    full_path = str(full_path)
                    
                    logger.info(f"Шукаємо відео файл: {full_path}")
                    
                    # Перевіряємо, чи файл існує
                    if os.path.exists(full_path) and os.path.isfile(full_path):
                        # Отримуємо ім'я файлу та тип контенту
                        filename = os.path.basename(file_path)
                        # Визначаємо тип контенту за розширенням
                        ext = os.path.splitext(filename)[1].lower()
                        if ext == '.mp4':
                            content_type = 'video/mp4'
                        elif ext == '.mov':
                            content_type = 'video/quicktime'
                        elif ext == '.avi':
                            content_type = 'video/x-msvideo'
                        elif ext == '.webm':
                            content_type = 'video/webm'
                        else:
                            content_type = 'video/mp4'  # За замовчуванням
                        
                        with open(full_path, 'rb') as f:
                            file_content = f.read()
                            email.attach(filename, file_content, content_type)
                        logger.info(f"Додано відео як вкладення: {filename} ({len(file_content)} байт)")
                    else:
                        logger.warning(f"Відео файл не знайдено або не є файлом: {full_path}")
                except Exception as e:
                    logger.error(f"Помилка додавання відео {video_url}: {e}", exc_info=True)
        
        email.send()
        logger.info(f"Email успішно відправлено на {email_to}")
        return True
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Помилка відправки email: {e}", exc_info=True)
        print(f"Помилка відправки email: {e}")
        print(f"Тип помилки: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return False


class SendResultsEmailView(APIView):
    """
    API endpoint для відправки результатів фотосесії на email незареєстрованого користувача.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({"detail": "Бронювання не знайдено"}, status=drf_status.HTTP_404_NOT_FOUND)

        user = request.user
        
        # Перевірка прав доступу - тільки фотограф або адмін можуть відправляти
        if user.role not in ["photographer", "admin"]:
            return Response({"detail": "Тільки фотограф або адміністратор може відправляти результати"}, status=drf_status.HTTP_403_FORBIDDEN)
        
        # Якщо фотограф - перевіряємо, що це його замовлення
        if user.role == "photographer":
            try:
                photographer = Photographer.objects.get(user=user)
                if booking.photographer != photographer:
                    return Response({"detail": "Ви можете відправляти результати тільки для своїх замовлень"}, status=drf_status.HTTP_403_FORBIDDEN)
            except Photographer.DoesNotExist:
                return Response({"detail": "Профіль фотографа не знайдено"}, status=drf_status.HTTP_404_NOT_FOUND)

        # Перевірка, чи є результати
        if not booking.result_photos and not booking.result_videos:
            return Response({"detail": "Немає результатів для відправки"}, status=drf_status.HTTP_400_BAD_REQUEST)

        # Отримуємо email з запиту або використовуємо email з бронювання
        recipient_email = request.data.get('email') or booking.guest_email
        
        if not recipient_email:
            return Response({"detail": "Email не вказано"}, status=drf_status.HTTP_400_BAD_REQUEST)

        # Відправляємо email
        success = send_results_email(booking, recipient_email)
        
        if success:
            return Response({"detail": "Результати успішно відправлено на email"}, status=drf_status.HTTP_200_OK)
        else:
            return Response({"detail": "Помилка відправки email. Перевірте налаштування email сервера."}, status=drf_status.HTTP_500_INTERNAL_SERVER_ERROR)
