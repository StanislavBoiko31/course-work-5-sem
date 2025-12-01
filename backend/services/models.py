from django.db import models

class Service(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=8, decimal_places=2)
    image = models.ImageField(upload_to='services/', blank=True, null=True)
    duration = models.PositiveIntegerField(default=60, help_text="Тривалість у хвилинах")
    location_address = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Адреса локації",
        help_text="Адреса студії або локація клієнта (наприклад, для фотосесії весілля). Залиште порожнім, якщо локація вибирається окремо."
    )

    def __str__(self):
        return self.name

class AdditionalService(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return self.name
