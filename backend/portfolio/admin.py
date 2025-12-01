from django.contrib import admin
from .models import Portfolio, HomePageContent


@admin.register(HomePageContent)
class HomePageContentAdmin(admin.ModelAdmin):
    """Адмін-панель для редагування контенту головної сторінки"""
    list_display = ('title', 'is_active')
    fieldsets = (
        ('Основний контент', {
            'fields': ('title', 'description', 'guest_promo_text', 'is_active')
        }),
        ('Контактна інформація', {
            'fields': ('contact_emails', 'contact_phones', 'contact_addresses'),
            'description': 'Використовуйте формат JSON списку. Наприклад: ["email1@example.com", "email2@example.com"]'
        }),
    )
    
    def has_add_permission(self, request):
        # Дозволяємо створення тільки якщо запису ще немає
        return not HomePageContent.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Не дозволяємо видалення (singleton pattern)
        return False


admin.site.register(Portfolio)