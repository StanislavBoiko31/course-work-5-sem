"""
Unit tests for Booking model.
"""
import pytest
from datetime import date, time, timedelta
from decimal import Decimal
from bookings.models import Booking


@pytest.mark.django_db
class TestBookingModel:
    """Test Booking model functionality."""

    def test_create_booking(self, booking):
        """Test creating a booking."""
        assert booking.user is not None
        assert booking.photographer is not None
        assert booking.service is not None
        assert booking.date is not None
        assert booking.status == 'Очікує підтвердження'

    def test_booking_str_with_user(self, booking):
        """Test Booking __str__ method with user."""
        expected = f"{booking.user.email} - {booking.photographer} - {booking.date} {booking.start_time}-{booking.end_time}"
        assert str(booking) == expected

    def test_booking_str_with_guest(self, guest_booking):
        """Test Booking __str__ method with guest."""
        expected = f"{guest_booking.guest_email} - {guest_booking.photographer} - {guest_booking.date} {guest_booking.start_time}-{guest_booking.end_time}"
        assert str(guest_booking) == expected

    def test_booking_guest_fields(self, photographer, service):
        """Test booking with guest information."""
        booking = Booking.objects.create(
            photographer=photographer,
            service=service,
            date=date.today() + timedelta(days=1),
            start_time=time(10, 0),
            guest_first_name='John',
            guest_last_name='Doe',
            guest_email='john@example.com',
            price=Decimal('1000.00')
        )
        assert booking.user is None
        assert booking.guest_first_name == 'John'
        assert booking.guest_last_name == 'Doe'
        assert booking.guest_email == 'john@example.com'

    def test_booking_additional_services(self, booking, additional_service):
        """Test booking additional services many-to-many relationship."""
        booking.additional_services.add(additional_service)
        assert additional_service in booking.additional_services.all()

    def test_booking_result_photos(self, booking):
        """Test booking result_photos JSONField."""
        booking.result_photos = ['/media/photo1.jpg', '/media/photo2.jpg']
        booking.save()
        booking.refresh_from_db()
        assert len(booking.result_photos) == 2
        assert '/media/photo1.jpg' in booking.result_photos

    def test_booking_result_videos(self, booking):
        """Test booking result_videos JSONField."""
        booking.result_videos = ['/media/video1.mp4']
        booking.save()
        booking.refresh_from_db()
        assert len(booking.result_videos) == 1
        assert '/media/video1.mp4' in booking.result_videos

