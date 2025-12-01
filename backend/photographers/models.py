from django.db import models
from django.conf import settings
from datetime import time
from services.models import Service

class Photographer(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    photo = models.ImageField(upload_to='photographers/', blank=True, null=True)
    services = models.ManyToManyField(Service, blank=True, related_name="photographers")
    work_start = models.TimeField(default=time(9, 0))
    work_end = models.TimeField(default=time(18, 0))
    work_days = models.CharField(
        max_length=20,
        default="0,1,2,3,4",  # Пн-Пт (0=Пн, 1=Вт, ..., 6=Нд)
        help_text="Дні тижня через кому, коли працює (0=Пн, 6=Нд)"
    )

    class Meta:
        ordering = ['user__email']  # Сортування для пагінації

    def __str__(self):
        return self.user.email  # або self.user.get_full_name() якщо хочеш ім'я+прізвище
