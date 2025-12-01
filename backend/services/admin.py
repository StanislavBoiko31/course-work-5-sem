from django.contrib import admin
from .models import Service


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'duration', 'location_address')
    list_filter = ('duration',)
    search_fields = ('name', 'description', 'location_address')
    fieldsets = (
        ('Основна інформація', {
            'fields': ('name', 'description', 'price', 'duration', 'image')
        }),
        ('Локація', {
            'fields': ('location_address',),
            'description': 'Адреса студії або локація клієнта (наприклад, для фотосесії весілля). Залиште порожнім, якщо локація вибирається окремо.'
        }),
    )