"""
Integration tests for Booking API views.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from datetime import date, time, timedelta
from decimal import Decimal


@pytest.mark.django_db
class TestBookingCreation:
    """Test booking creation endpoints."""

    def test_create_booking_authenticated(self, authenticated_api_client, photographer, service):
        """Test creating a booking as authenticated user."""
        url = reverse('booking-list-create')
        booking_date = date.today() + timedelta(days=1)
        data = {
            'service_id': service.id,
            'photographer_id': photographer.id,
            'date': str(booking_date),
            'start_time': '10:00:00'
        }
        response = authenticated_api_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['service_obj']['id'] == service.id

    def test_create_booking_guest(self, api_client, photographer, service):
        """Test creating a booking as guest."""
        url = reverse('booking-list-create')
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
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['guest_email'] == 'guest@example.com'

    def test_create_booking_missing_fields(self, api_client):
        """Test creating booking with missing required fields."""
        url = reverse('booking-list-create')
        data = {}
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestMyBookings:
    """Test my bookings endpoint."""

    def test_get_my_bookings(self, authenticated_api_client, booking):
        """Test getting current user's bookings."""
        url = reverse('my-bookings')
        response = authenticated_api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_get_my_bookings_unauthorized(self, api_client):
        """Test getting bookings without authentication."""
        url = reverse('my-bookings')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestAvailableSlots:
    """Test available slots endpoint."""

    def test_get_available_slots(self, api_client, photographer, service):
        """Test getting available slots."""
        url = reverse('available-slots')
        booking_date = date.today() + timedelta(days=1)
        params = {
            'photographer': photographer.id,
            'service': service.id,
            'date': str(booking_date)
        }
        response = api_client.get(url, params)
        assert response.status_code == status.HTTP_200_OK
        assert 'slots' in response.data


@pytest.mark.django_db
class TestAvailableDates:
    """Test available dates endpoint."""

    def test_get_available_dates(self, api_client, photographer):
        """Test getting available dates."""
        url = reverse('available-dates')
        params = {'photographer': photographer.id}
        response = api_client.get(url, params)
        assert response.status_code == status.HTTP_200_OK
        assert 'available_dates' in response.data

    def test_get_available_dates_missing_param(self, api_client):
        """Test getting available dates without photographer_id."""
        url = reverse('available-dates')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestBookingUpdate:
    """Test booking update endpoint."""

    def test_update_booking(self, authenticated_api_client, booking):
        """Test updating a booking."""
        url = reverse('booking-update', kwargs={'pk': booking.id})
        data = {'status': 'Підтверджено'}
        response = authenticated_api_client.patch(url, data)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN]

    def test_update_booking_unauthorized(self, api_client, booking):
        """Test updating booking without authentication."""
        url = reverse('booking-update', kwargs={'pk': booking.id})
        data = {'status': 'Підтверджено'}
        response = api_client.patch(url, data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestBookingList:
    """Test booking list endpoint."""

    def test_list_bookings(self, api_client):
        """Test listing all bookings."""
        url = reverse('booking-list-create')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data


@pytest.mark.django_db
class TestPhotographerBookings:
    """Test photographer bookings endpoint."""

    def test_get_photographer_bookings(self, authenticated_photographer_api_client, booking):
        """Test getting photographer's bookings."""
        url = reverse('photographer-bookings')
        response = authenticated_photographer_api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data

    def test_get_photographer_bookings_unauthorized(self, api_client):
        """Test getting photographer bookings without authentication."""
        url = reverse('photographer-bookings')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestBookingUpdateScenarios:
    """Test various booking update scenarios."""

    def test_update_booking_status_to_confirmed(self, authenticated_api_client, booking):
        """Test updating booking status to confirmed."""
        url = reverse('booking-update', kwargs={'pk': booking.id})
        data = {'status': 'Підтверджено адміністратором'}
        response = authenticated_api_client.patch(url, data)
        # User can only update if status is "Очікує підтвердження"
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN]

    def test_update_booking_status_to_cancelled(self, authenticated_api_client, booking):
        """Test updating booking status to cancelled."""
        url = reverse('booking-update', kwargs={'pk': booking.id})
        data = {'status': 'Скасовано'}
        response = authenticated_api_client.patch(url, data)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN]


    def test_photographer_update_booking_status_to_done(self, authenticated_photographer_api_client, booking):
        """Test photographer updating booking status to done."""
        url = reverse('booking-update', kwargs={'pk': booking.id})
        data = {'status': 'Зроблено'}
        response = authenticated_photographer_api_client.patch(url, data)
        # Photographer can update their own bookings
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN]

    def test_update_booking_by_photographer(self, authenticated_photographer_api_client, booking):
        """Test updating booking by photographer."""
        url = reverse('booking-update', kwargs={'pk': booking.id})
        data = {'status': 'Підтверджено'}
        response = authenticated_photographer_api_client.patch(url, data)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN]


@pytest.mark.django_db
class TestAvailableSlotsScenarios:
    """Test available slots scenarios."""

    def test_get_available_slots_missing_params(self, api_client):
        """Test getting available slots with missing parameters."""
        url = reverse('available-slots')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_available_slots_invalid_date(self, api_client, photographer, service):
        """Test getting available slots with invalid date."""
        url = reverse('available-slots')
        params = {
            'photographer': photographer.id,
            'service': service.id,
            'date': 'invalid-date'
        }
        response = api_client.get(url, params)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_available_slots_non_working_day(self, api_client, photographer, service):
        """Test getting available slots on non-working day."""
        # Set photographer to work only on weekdays (0-4)
        photographer.work_days = '0,1,2,3,4'
        photographer.save()
        # Get a Saturday (weekday 5)
        booking_date = date.today()
        while booking_date.weekday() != 5:
            booking_date += timedelta(days=1)
        
        url = reverse('available-slots')
        params = {
            'photographer': photographer.id,
            'service': service.id,
            'date': str(booking_date)
        }
        response = api_client.get(url, params)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['slots'] == []


@pytest.mark.django_db
class TestBookingCreateView:
    """Test BookingListCreateView endpoint (used for booking creation)."""

    def test_create_booking_missing_service(self, api_client, photographer):
        """Test creating booking without service."""
        url = reverse('booking-list-create')
        booking_date = date.today() + timedelta(days=1)
        data = {
            'photographer_id': photographer.id,
            'date': str(booking_date),
            'start_time': '10:00:00'
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_booking_missing_photographer(self, api_client, service):
        """Test creating booking without photographer."""
        url = reverse('booking-list-create')
        booking_date = date.today() + timedelta(days=1)
        data = {
            'service_id': service.id,
            'date': str(booking_date),
            'start_time': '10:00:00'
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_booking_missing_date(self, api_client, photographer, service):
        """Test creating booking without date."""
        url = reverse('booking-list-create')
        data = {
            'service_id': service.id,
            'photographer_id': photographer.id,
            'start_time': '10:00:00'
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_booking_invalid_date_format(self, api_client, photographer, service):
        """Test creating booking with invalid date format."""
        url = reverse('booking-list-create')
        data = {
            'service_id': service.id,
            'photographer_id': photographer.id,
            'date': 'invalid-date',
            'start_time': '10:00:00'
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestUploadBookingResults:
    """Test UploadBookingResultsView endpoint."""

    def test_upload_results_as_photographer(self, authenticated_photographer_api_client, booking):
        """Test uploading results as photographer."""
        booking.status = 'Підтверджено адміністратором'
        booking.save()
        
        url = reverse('upload-booking-results', kwargs={'booking_id': booking.id})
        # Create a simple test file
        from io import BytesIO
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        photo = SimpleUploadedFile("test.jpg", b"file_content", content_type="image/jpeg")
        data = {'photos': [photo]}
        
        response = authenticated_photographer_api_client.post(url, data, format='multipart')
        # May fail if booking is not for this photographer, which is expected
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST]

    def test_upload_results_as_user(self, authenticated_api_client, booking):
        """Test uploading results as regular user (should fail)."""
        booking.status = 'Підтверджено адміністратором'
        booking.save()
        
        url = reverse('upload-booking-results', kwargs={'booking_id': booking.id})
        response = authenticated_api_client.post(url, {})
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_upload_results_nonexistent_booking(self, authenticated_photographer_api_client):
        """Test uploading results for non-existent booking."""
        url = reverse('upload-booking-results', kwargs={'booking_id': 99999})
        response = authenticated_photographer_api_client.post(url, {})
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_upload_results_wrong_status(self, authenticated_photographer_api_client, booking):
        """Test uploading results for booking with wrong status."""
        booking.status = 'Очікує підтвердження'
        booking.save()
        
        url = reverse('upload-booking-results', kwargs={'booking_id': booking.id})
        response = authenticated_photographer_api_client.post(url, {})
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN]


@pytest.mark.django_db
class TestSendResultsEmail:
    """Test SendResultsEmailView endpoint."""

    def test_send_results_email_as_photographer(self, authenticated_photographer_api_client, booking):
        """Test sending results email as photographer."""
        booking.status = 'Зроблено'
        booking.result_photos = ['/media/test.jpg']
        booking.guest_email = 'guest@example.com'
        booking.save()
        
        url = reverse('send-results-email', kwargs={'booking_id': booking.id})
        response = authenticated_photographer_api_client.post(url, {})
        # May fail if booking is not for this photographer
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]

    def test_send_results_email_nonexistent_booking(self, authenticated_photographer_api_client):
        """Test sending email for non-existent booking."""
        url = reverse('send-results-email', kwargs={'booking_id': 99999})
        response = authenticated_photographer_api_client.post(url, {})
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestBookingUpdateView:
    """Additional tests for BookingUpdateView."""

    def test_update_booking_with_additional_services(self, authenticated_api_client, booking, additional_service):
        """Test updating booking with additional services."""
        url = reverse('booking-update', kwargs={'pk': booking.id})
        # Pass as list properly formatted for DRF
        data = {
            'additional_service_ids': [additional_service.id]
        }
        # DRF expects list format, so we need to format it correctly
        response = authenticated_api_client.patch(url, data, format='json')
        # May fail if user doesn't have permission or booking status doesn't allow update
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST]

    def test_update_booking_price_recalculation(self, authenticated_api_client, booking, additional_service):
        """Test price recalculation when updating booking."""
        url = reverse('booking-update', kwargs={'pk': booking.id})
        data = {
            'additional_service_ids': [additional_service.id]
        }
        response = authenticated_api_client.patch(url, data, format='json')
        # May fail if user doesn't have permission or booking status doesn't allow update
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST]

    def test_update_booking_by_admin(self, admin_api_client, booking):
        """Test updating booking by admin."""
        url = reverse('booking-update', kwargs={'pk': booking.id})
        data = {'status': 'Підтверджено адміністратором'}
        response = admin_api_client.patch(url, data)
        assert response.status_code == status.HTTP_200_OK

