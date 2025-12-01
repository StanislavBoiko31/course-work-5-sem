from django.core.management.base import BaseCommand
from django.db import connection
from django.test import RequestFactory
from django.contrib.auth import get_user_model
from bookings.models import Booking
from photographers.models import Photographer
from services.models import Service
from portfolio.models import Portfolio
from django.db import reset_queries
import json
import time
from datetime import datetime

User = get_user_model()


class Command(BaseCommand):
    help = 'Аналіз продуктивності та SQL-запитів для звіту'

    def calculate_total_time(self, queries):
        """Розраховує загальний час виконання всіх запитів"""
        total = 0.0
        for query in queries:
            try:
                total += float(query.get('time', 0))
            except (ValueError, TypeError):
                pass
        return total

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n' + '='*70))
        self.stdout.write(self.style.SUCCESS('  АНАЛІЗ ПРОДУКТИВНОСТІ DJANGO DEBUG TOOLBAR'))
        self.stdout.write(self.style.SUCCESS('='*70 + '\n'))
        
        # Увімкнути логування SQL-запитів
        from django.conf import settings
        settings.DEBUG = True
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'database_queries': [],
            'statistics': {},
            'performance_metrics': []
        }
        
        # Аналіз моделей
        self.stdout.write(self.style.WARNING('📊 1. АНАЛІЗ SQL-ЗАПИТІВ ТА ЧАСУ ВИКОНАННЯ\n'))
        self.stdout.write('-' * 70)
        
        # Тест 1: Отримання всіх бронювань
        reset_queries()
        start_time = time.time()
        bookings = list(Booking.objects.all()[:10])
        execution_time = (time.time() - start_time) * 1000  # в мілісекундах
        queries = connection.queries
        total_query_time = self.calculate_total_time(queries) * 1000  # в мілісекундах
        
        self.stdout.write(f"\n🔹 Отримання 10 бронювань:")
        self.stdout.write(f"   ├─ SQL-запитів: {len(queries)}")
        self.stdout.write(f"   ├─ Час виконання запитів: {total_query_time:.2f} мс")
        self.stdout.write(f"   └─ Загальний час: {execution_time:.2f} мс")
        
        results['performance_metrics'].append({
            'operation': 'Отримання 10 бронювань',
            'query_count': len(queries),
            'query_time_ms': round(total_query_time, 2),
            'total_time_ms': round(execution_time, 2)
        })
        
        # Тест 2: Отримання з select_related
        reset_queries()
        start_time = time.time()
        bookings_optimized = list(Booking.objects.select_related('user', 'photographer', 'service').all()[:10])
        execution_time = (time.time() - start_time) * 1000
        queries = connection.queries
        total_query_time = self.calculate_total_time(queries) * 1000
        
        self.stdout.write(f"\n🔹 Отримання 10 бронювань (з select_related):")
        self.stdout.write(f"   ├─ SQL-запитів: {len(queries)}")
        self.stdout.write(f"   ├─ Час виконання запитів: {total_query_time:.2f} мс")
        self.stdout.write(f"   └─ Загальний час: {execution_time:.2f} мс")
        
        results['performance_metrics'].append({
            'operation': 'Отримання 10 бронювань (оптимізовано)',
            'query_count': len(queries),
            'query_time_ms': round(total_query_time, 2),
            'total_time_ms': round(execution_time, 2)
        })
        
        # Тест 3: Отримання фотографів
        reset_queries()
        start_time = time.time()
        photographers = list(Photographer.objects.all()[:10])
        execution_time = (time.time() - start_time) * 1000
        queries = connection.queries
        total_query_time = self.calculate_total_time(queries) * 1000
        
        self.stdout.write(f"\n🔹 Отримання 10 фотографів:")
        self.stdout.write(f"   ├─ SQL-запитів: {len(queries)}")
        self.stdout.write(f"   ├─ Час виконання запитів: {total_query_time:.2f} мс")
        self.stdout.write(f"   └─ Загальний час: {execution_time:.2f} мс")
        
        results['performance_metrics'].append({
            'operation': 'Отримання 10 фотографів',
            'query_count': len(queries),
            'query_time_ms': round(total_query_time, 2),
            'total_time_ms': round(execution_time, 2)
        })
        
        # Тест 4: Отримання портфоліо
        reset_queries()
        start_time = time.time()
        portfolio = list(Portfolio.objects.all()[:10])
        execution_time = (time.time() - start_time) * 1000
        queries = connection.queries
        total_query_time = self.calculate_total_time(queries) * 1000
        
        self.stdout.write(f"\n🔹 Отримання 10 портфоліо:")
        self.stdout.write(f"   ├─ SQL-запитів: {len(queries)}")
        self.stdout.write(f"   ├─ Час виконання запитів: {total_query_time:.2f} мс")
        self.stdout.write(f"   └─ Загальний час: {execution_time:.2f} мс")
        
        results['performance_metrics'].append({
            'operation': 'Отримання 10 портфоліо',
            'query_count': len(queries),
            'query_time_ms': round(total_query_time, 2),
            'total_time_ms': round(execution_time, 2)
        })
        
        # Тест 5: Отримання портфоліо з оптимізацією
        reset_queries()
        start_time = time.time()
        portfolio_optimized = list(Portfolio.objects.select_related('photographer', 'service').all()[:10])
        execution_time = (time.time() - start_time) * 1000
        queries = connection.queries
        total_query_time = self.calculate_total_time(queries) * 1000
        
        self.stdout.write(f"\n🔹 Отримання 10 портфоліо (з select_related):")
        self.stdout.write(f"   ├─ SQL-запитів: {len(queries)}")
        self.stdout.write(f"   ├─ Час виконання запитів: {total_query_time:.2f} мс")
        self.stdout.write(f"   └─ Загальний час: {execution_time:.2f} мс")
        
        results['performance_metrics'].append({
            'operation': 'Отримання 10 портфоліо (оптимізовано)',
            'query_count': len(queries),
            'query_time_ms': round(total_query_time, 2),
            'total_time_ms': round(execution_time, 2)
        })
        
        # Статистика моделей
        self.stdout.write(self.style.WARNING('\n\n📈 2. СТАТИСТИКА БАЗИ ДАНИХ\n'))
        self.stdout.write('-' * 70)
        
        stats = {
            'users': User.objects.count(),
            'photographers': Photographer.objects.count(),
            'services': Service.objects.count(),
            'bookings': Booking.objects.count(),
            'portfolio': Portfolio.objects.count(),
        }
        results['statistics'] = stats
        
        for model, count in stats.items():
            self.stdout.write(f"   {model.capitalize()}: {count} записів")
        
        # Аналіз N+1 проблем
        self.stdout.write(self.style.WARNING('\n\n⚠️  3. АНАЛІЗ N+1 ПРОБЛЕМ\n'))
        self.stdout.write('-' * 70)
        
        # Приклад N+1 проблеми
        reset_queries()
        start_time = time.time()
        bookings_n1 = list(Booking.objects.all()[:5])
        for booking in bookings_n1:
            _ = booking.photographer.user.email if booking.photographer else None
            _ = booking.service.name if booking.service else None
        execution_time_n1 = (time.time() - start_time) * 1000
        queries_n1 = connection.queries
        total_query_time_n1 = self.calculate_total_time(queries_n1) * 1000
        
        reset_queries()
        start_time = time.time()
        bookings_opt = list(Booking.objects.select_related('photographer__user', 'service').all()[:5])
        for booking in bookings_opt:
            _ = booking.photographer.user.email if booking.photographer else None
            _ = booking.service.name if booking.service else None
        execution_time_opt = (time.time() - start_time) * 1000
        queries_opt = connection.queries
        total_query_time_opt = self.calculate_total_time(queries_opt) * 1000
        
        self.stdout.write(f"\n🔹 Без оптимізації (N+1 проблема):")
        self.stdout.write(f"   ├─ SQL-запитів: {len(queries_n1)}")
        self.stdout.write(f"   ├─ Час виконання запитів: {total_query_time_n1:.2f} мс")
        self.stdout.write(f"   └─ Загальний час: {execution_time_n1:.2f} мс")
        
        self.stdout.write(f"\n🔹 З оптимізацією (select_related):")
        self.stdout.write(f"   ├─ SQL-запитів: {len(queries_opt)}")
        self.stdout.write(f"   ├─ Час виконання запитів: {total_query_time_opt:.2f} мс")
        self.stdout.write(f"   └─ Загальний час: {execution_time_opt:.2f} мс")
        
        improvement_queries = len(queries_n1) - len(queries_opt)
        improvement_time = execution_time_n1 - execution_time_opt
        improvement_percent = (improvement_queries / len(queries_n1) * 100) if queries_n1 else 0
        
        improvement_time_percent = (improvement_time / execution_time_n1 * 100) if execution_time_n1 > 0 else 0
        self.stdout.write(f"\n✅ Покращення:")
        self.stdout.write(f"   ├─ Менше SQL-запитів: {improvement_queries} ({improvement_percent:.1f}%)")
        self.stdout.write(f"   └─ Швидше виконання: {improvement_time:.2f} мс ({improvement_time_percent:.1f}%)")
        
        results['performance_metrics'].append({
            'operation': 'N+1 проблема (без оптимізації)',
            'query_count': len(queries_n1),
            'query_time_ms': round(total_query_time_n1, 2),
            'total_time_ms': round(execution_time_n1, 2)
        })
        
        results['performance_metrics'].append({
            'operation': 'N+1 проблема (з оптимізацією)',
            'query_count': len(queries_opt),
            'query_time_ms': round(total_query_time_opt, 2),
            'total_time_ms': round(execution_time_opt, 2),
            'improvement_queries': improvement_queries,
            'improvement_time_ms': round(improvement_time, 2),
            'improvement_percent': round(improvement_percent, 1)
        })
        
        # Підсумкова таблиця
        self.stdout.write(self.style.SUCCESS('\n\n📋 4. ПІДСУМКОВА ТАБЛИЦЯ МЕТРИК\n'))
        self.stdout.write('=' * 70)
        self.stdout.write(f"{'Операція':<45} {'Запитів':<10} {'Час (мс)':<12} {'Загальний (мс)':<15}")
        self.stdout.write('-' * 70)
        
        for metric in results['performance_metrics']:
            operation = metric['operation'][:44]
            queries = metric['query_count']
            query_time = metric['query_time_ms']
            total_time = metric['total_time_ms']
            self.stdout.write(f"{operation:<45} {queries:<10} {query_time:<12.2f} {total_time:<15.2f}")
        
        # Збереження звіту
        report_file = 'debug_toolbar_report.json'
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False, default=str)
        
        self.stdout.write(self.style.SUCCESS(f'\n\n✅ Звіт збережено у файл: {report_file}\n'))
        
        # Підсумок
        self.stdout.write(self.style.SUCCESS('=' * 70))
        self.stdout.write(self.style.SUCCESS('  ПІДСУМОК'))
        self.stdout.write(self.style.SUCCESS('=' * 70))
        self.stdout.write('\nДля детального інтерактивного аналізу:')
        self.stdout.write('1. Запустити сервер: python manage.py runserver')
        self.stdout.write('2. Відкрити будь-яку сторінку в браузері')
        self.stdout.write('3. Подивитися панель Debug Toolbar справа на екрані')
        self.stdout.write('4. Натиснути на панель "SQL" для детального аналізу запитів\n')

