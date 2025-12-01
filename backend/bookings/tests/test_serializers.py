"""
Unit tests for Booking serializers.
"""
import pytest
from unittest.mock import Mock, PropertyMock
from datetime import date, time, timedelta
from decimal import Decimal
from bookings.serializers import BookingSerializer
from bookings.models import Booking


@pytest.mark.django_db
class TestBookingSerializer:
    """Test BookingSerializer functionality."""

    def test_serialize_booking(self, booking):
        """Test serializing a booking."""
        serializer = BookingSerializer(booking)
        data = serializer.data
        assert 'service_obj' in data
        assert 'user' in data
        assert 'photographer' in data
        assert str(data['date']) == str(booking.date)

    def test_create_booking_authenticated(self, authenticated_api_client, user, photographer, service):
        """Test creating a booking for authenticated user."""
        booking_date = date.today() + timedelta(days=1)
        data = {
            'service_id': service.id,
            'photographer_id': photographer.id,
            'date': str(booking_date),
            'start_time': '10:00:00'
        }
        # Create a mock request object with user attribute
        mock_request = Mock()
        mock_request.user = user
        # Mock is_authenticated as a property
        type(mock_request.user).is_authenticated = PropertyMock(return_value=True)
        
        serializer = BookingSerializer(data=data, context={'request': mock_request})
        assert serializer.is_valid(), f"Serializer errors: {serializer.errors}"
        booking = serializer.save()
        assert booking.user == user
        assert booking.service == service
        assert booking.photographer == photographer

    def test_create_booking_guest(self, api_client, photographer, service):
        """Test creating a booking for guest."""
        booking_date = date.today() + timedelta(days=1)
        data = {
            'service_id': service.id,
            'photographer_id': photographer.id,
            'date': str(booking_date),
            'start_time': '10:00:00',
            'guest_first_name': 'Guest',
            'guest_last_name': 'User',
            'guest_email': 'guest@example.com'
        }
        # Create a mock request object without authenticated user
        mock_request = Mock()
        mock_user = Mock()
        type(mock_user).is_authenticated = PropertyMock(return_value=False)
        mock_request.user = mock_user
        
        serializer = BookingSerializer(data=data, context={'request': mock_request})
        assert serializer.is_valid(), f"Serializer errors: {serializer.errors}"
        booking = serializer.save()
        assert booking.user is None
        assert booking.guest_email == 'guest@example.com'

    def test_booking_price_calculation(self, authenticated_api_client, user, photographer, service, additional_service):
        """Test booking price calculation with discount."""
        user.personal_discount = Decimal('5.00')
        user.save()
        booking_date = date.today() + timedelta(days=1)
        data = {
            'service_id': service.id,
            'photographer_id': photographer.id,
            'date': str(booking_date),
            'start_time': '10:00:00',
            'additional_service_ids': [additional_service.id]
        }
        # Create a mock request object with user attribute
        mock_request = Mock()
        mock_request.user = user
        # Mock is_authenticated as a property
        type(mock_request.user).is_authenticated = PropertyMock(return_value=True)
        
        serializer = BookingSerializer(data=data, context={'request': mock_request})
        assert serializer.is_valid(), f"Serializer errors: {serializer.errors}"
        booking = serializer.save()
        # Price should be calculated: (service.price + additional_service.price) * (1 - discount/100)
        expected_price = (float(service.price) + float(additional_service.price)) * 0.95
        assert abs(float(booking.price) - expected_price) < 0.01

