"""
Unit tests for helper functions in bookings.views.
"""
import pytest
from datetime import date, time, timedelta, datetime
from decimal import Decimal
from bookings.views import increase_user_discount, is_slot_available
from bookings.models import Booking
from photographers.models import Photographer
from services.models import Service
from users.models import User


@pytest.mark.django_db
class TestIncreaseUserDiscount:
    """Unit tests for increase_user_discount function."""

    def test_increase_discount_for_user(self, user, booking):
        """Test increasing discount for registered user."""
        # Set initial discount
        user.personal_discount = Decimal('5.00')
        user.save()
        
        booking.user = user
        booking.status = 'Зроблено'
        booking.save()
        
        # Call function
        result = increase_user_discount(booking)
        
        # Check discount increased by 0.5%
        user.refresh_from_db()
        assert float(user.personal_discount) == 5.5
        assert result == 5.5

    def test_increase_discount_max_limit(self, user, booking):
        """Test discount doesn't exceed 10%."""
        # Set discount to 9.8%
        user.personal_discount = Decimal('9.80')
        user.save()
        
        booking.user = user
        booking.status = 'Зроблено'
        booking.save()
        
        # Call function
        result = increase_user_discount(booking)
        
        # Check discount capped at 10%
        user.refresh_from_db()
        assert float(user.personal_discount) == 10.0
        assert result == 10.0

    def test_increase_discount_from_zero(self, user, booking):
        """Test increasing discount from zero."""
        user.personal_discount = Decimal('0.00')
        user.save()
        
        booking.user = user
        booking.status = 'Зроблено'
        booking.save()
        
        result = increase_user_discount(booking)
        
        user.refresh_from_db()
        assert float(user.personal_discount) == 0.5
        assert result == 0.5

    def test_no_discount_for_guest(self, photographer, service):
        """Test that guests don't get discount increase."""
        booking_date = date.today() + timedelta(days=1)
        guest_booking = Booking.objects.create(
            user=None,
            photographer=photographer,
            service=service,
            date=booking_date,
            start_time=time(10, 0),
            end_time=time(11, 0),
            status='Зроблено',
            guest_email='guest@example.com',
            price=Decimal('1000.00')
        )
        
        # Call function - should return early
        result = increase_user_discount(guest_booking)
        
        # Should return None or current discount (no change)
        assert result is None or result == 0.0

    def test_discount_precise_increase(self, user, booking):
        """Test that discount increases by exactly 0.5%."""
        user.personal_discount = Decimal('2.50')
        user.save()
        
        booking.user = user
        booking.status = 'Зроблено'
        booking.save()
        
        result = increase_user_discount(booking)
        
        user.refresh_from_db()
        assert float(user.personal_discount) == 3.0
        assert result == 3.0


@pytest.mark.django_db
class TestIsSlotAvailable:
    """Unit tests for is_slot_available function."""

    def test_slot_available_on_working_day(self, photographer, service):
        """Test slot is available on working day."""
        booking_date = date.today() + timedelta(days=1)
        # Ensure it's a weekday (photographer works Mon-Fri)
        while booking_date.weekday() > 4:
            booking_date += timedelta(days=1)
        
        start_time = time(10, 0)
        duration = 60
        
        is_available, message = is_slot_available(photographer, booking_date, start_time, duration)
        
        assert is_available is True
        assert message == ""

    def test_slot_unavailable_on_non_working_day(self, photographer, service):
        """Test slot is unavailable on non-working day."""
        booking_date = date.today()
        # Find Saturday (weekday 5)
        while booking_date.weekday() != 5:
            booking_date += timedelta(days=1)
        
        start_time = time(10, 0)
        duration = 60
        
        is_available, message = is_slot_available(photographer, booking_date, start_time, duration)
        
        assert is_available is False
        assert "не працює" in message

    def test_slot_unavailable_before_work_start(self, photographer, service):
        """Test slot is unavailable before work start time."""
        booking_date = date.today() + timedelta(days=1)
        while booking_date.weekday() > 4:
            booking_date += timedelta(days=1)
        
        # Try to book at 8:00 when work starts at 9:00
        start_time = time(8, 0)
        duration = 60
        
        is_available, message = is_slot_available(photographer, booking_date, start_time, duration)
        
        assert is_available is False
        assert "робочим часом" in message

    def test_slot_unavailable_after_work_end(self, photographer, service):
        """Test slot is unavailable after work end time."""
        booking_date = date.today() + timedelta(days=1)
        while booking_date.weekday() > 4:
            booking_date += timedelta(days=1)
        
        # Try to book at 18:00 when work ends at 18:00
        start_time = time(18, 0)
        duration = 60
        
        is_available, message = is_slot_available(photographer, booking_date, start_time, duration)
        
        assert is_available is False
        assert "робочим часом" in message or "межі" in message

    def test_slot_unavailable_when_overlaps_booking(self, photographer, service, booking):
        """Test slot is unavailable when it overlaps with existing booking."""
        # Use the same date and time as existing booking
        booking_date = booking.date
        start_time = booking.start_time
        duration = 60
        
        is_available, message = is_slot_available(photographer, booking_date, start_time, duration)
        
        assert is_available is False
        assert "зайнятий" in message

    def test_slot_available_when_no_overlap(self, photographer, service, booking):
        """Test slot is available when it doesn't overlap with existing booking."""
        booking_date = booking.date
        # Book 2 hours after existing booking
        start_time = (datetime.combine(booking_date, booking.end_time) + timedelta(hours=2)).time()
        duration = 60
        
        is_available, message = is_slot_available(photographer, booking_date, start_time, duration)
        
        assert is_available is True
        assert message == ""

    def test_slot_unavailable_when_ends_after_work(self, photographer, service):
        """Test slot is unavailable when it ends after work hours."""
        booking_date = date.today() + timedelta(days=1)
        while booking_date.weekday() > 4:
            booking_date += timedelta(days=1)
        
        # Book at 17:30 for 60 minutes (ends at 18:30, but work ends at 18:00)
        start_time = time(17, 30)
        duration = 60
        
        is_available, message = is_slot_available(photographer, booking_date, start_time, duration)
        
        assert is_available is False
        assert "межі" in message or "робочого дня" in message

