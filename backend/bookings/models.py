from django.db import models
from django.conf import settings
from services.models import Service, AdditionalService
from photographers.models import Photographer
from users.models import User

class Booking(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookings", null=True, blank=True)
    photographer = models.ForeignKey(Photographer, on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=32, default="Очікує підтвердження")
    # Додаємо для гостей:
    guest_first_name = models.CharField(max_length=50, null=True, blank=True)
    guest_last_name = models.CharField(max_length=50, null=True, blank=True)
    guest_email = models.EmailField(null=True, blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    # Додаткові послуги
    additional_services = models.ManyToManyField(AdditionalService, blank=True, related_name="bookings")
    # Результати роботи (фото та відео)
    result_photos = models.JSONField(default=list, blank=True)  # Список URL фото
    result_videos = models.JSONField(default=list, blank=True)  # Список URL відео

    def __str__(self):
        if self.user:
            return f"{self.user.email} - {self.photographer} - {self.date} {self.start_time}-{self.end_time}"
        else:
            return f"{self.guest_email} - {self.photographer} - {self.date} {self.start_time}-{self.end_time}"