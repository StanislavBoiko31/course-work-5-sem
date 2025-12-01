"""
Unit tests for Photographer model.
"""
import pytest
from django.contrib.auth import get_user_model
from photographers.models import Photographer
from services.models import Service

User = get_user_model()


@pytest.mark.django_db
class TestPhotographerModel:
    """Test Photographer model functionality."""

    def test_create_photographer(self, photographer_user):
        """Test creating a photographer."""
        photographer = Photographer.objects.create(
            user=photographer_user,
            bio='Test bio',
            phone='+380501234567'
        )
        assert photographer.user == photographer_user
        assert photographer.bio == 'Test bio'
        assert photographer.phone == '+380501234567'

    def test_photographer_str(self, photographer):
        """Test Photographer __str__ method."""
        assert str(photographer) == photographer.user.email

    def test_photographer_work_schedule_defaults(self, photographer_user):
        """Test photographer work schedule defaults."""
        photographer = Photographer.objects.create(user=photographer_user)
        # Refresh from database to ensure defaults are applied
        photographer.refresh_from_db()
        # work_start and work_end are TimeField, so they return time objects after save
        from datetime import time
        
        # work_start and work_end should be time objects
        assert isinstance(photographer.work_start, time)
        assert isinstance(photographer.work_end, time)
        assert photographer.work_start.hour == 9
        assert photographer.work_start.minute == 0
        assert photographer.work_end.hour == 18
        assert photographer.work_end.minute == 0
        assert photographer.work_days == '0,1,2,3,4'

    def test_photographer_one_to_one_user(self, photographer_user):
        """Test that photographer has one-to-one relationship with user."""
        photographer = Photographer.objects.create(user=photographer_user)
        # Try to create another photographer with same user should fail
        with pytest.raises(Exception):  # IntegrityError
            Photographer.objects.create(user=photographer_user)

    def test_photographer_services_many_to_many(self, photographer, service):
        """Test photographer services many-to-many relationship."""
        photographer.services.add(service)
        assert service in photographer.services.all()
        assert photographer in service.photographers.all()

