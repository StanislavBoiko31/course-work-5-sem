from django.db import models
from photographers.models import Photographer
from services.models import Service

class Portfolio(models.Model):
    photographer = models.ForeignKey(Photographer, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='portfolio/')
    description = models.TextField()
    service = models.ForeignKey(Service, on_delete=models.CASCADE)

    class Meta:
        ordering = ['-id']  # Сортування для пагінації (нові спочатку)

    def __str__(self):
        return f"{self.photographer} - {self.description[:20]}"


class HomePageContent(models.Model):
    """
    Модель для зберігання контенту головної сторінки.
    Використовується singleton pattern - завжди один запис.
    """
    title = models.CharField(max_length=200, default="Ласкаво просимо до нашої фотостудії", verbose_name="Заголовок")
    description = models.TextField(
        default="Ми створюємо незабутні моменти та професійні фотографії для ваших особливих подій.",
        verbose_name="Опис"
    )
    # Використовуємо JSONField для зберігання списків
    contact_emails = models.JSONField(default=list, blank=True, verbose_name="Email для контактів (список)")
    contact_phones = models.JSONField(default=list, blank=True, verbose_name="Телефони (список)")
    contact_addresses = models.JSONField(default=list, blank=True, verbose_name="Адреси (список)")
    guest_promo_text = models.CharField(
        max_length=255,
        blank=True,
        default="Зареєструйтесь, щоб отримати персональну знижку на фотосесію.",
        verbose_name="Текст для гостей (незареєстрованих користувачів)",
    )
    is_active = models.BooleanField(default=True, verbose_name="Активний")
    
    # Залишаємо старі поля для зворотної сумісності (deprecated)
    contact_email = models.EmailField(default="info@studio.com", blank=True, verbose_name="Email (застаріле)")
    contact_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Телефон (застаріле)")
    contact_address = models.TextField(blank=True, null=True, verbose_name="Адреса (застаріле)")

    class Meta:
        verbose_name = "Контент головної сторінки"
        verbose_name_plural = "Контент головної сторінки"

    def __str__(self):
        return "Контент головної сторінки"
    
    def save(self, *args, **kwargs):
        # Singleton pattern - завжди один запис
        self.pk = 1
        # Переконуємося, що списки є списками
        if not isinstance(self.contact_emails, list):
            self.contact_emails = []
        if not isinstance(self.contact_phones, list):
            self.contact_phones = []
        if not isinstance(self.contact_addresses, list):
            self.contact_addresses = []
        super().save(*args, **kwargs)
    
    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj