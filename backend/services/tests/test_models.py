"""
Unit tests for Service and AdditionalService models.
"""
import pytest
from decimal import Decimal
from services.models import Service, AdditionalService


@pytest.mark.django_db
class TestServiceModel:
    """Test Service model functionality."""

    def test_create_service(self):
        """Test creating a service."""
        service = Service.objects.create(
            name='Wedding Photography',
            description='Professional wedding photography',
            price=Decimal('5000.00'),
            duration=120
        )
        assert service.name == 'Wedding Photography'
        assert service.description == 'Professional wedding photography'
        assert service.price == Decimal('5000.00')
        assert service.duration == 120

    def test_service_str(self, service):
        """Test Service __str__ method."""
        assert str(service) == service.name

    def test_service_duration_default(self):
        """Test that duration has default value."""
        service = Service.objects.create(
            name='Test Service',
            description='Test',
            price=Decimal('1000.00')
        )
        assert service.duration == 60


@pytest.mark.django_db
class TestAdditionalServiceModel:
    """Test AdditionalService model functionality."""

    def test_create_additional_service(self):
        """Test creating an additional service."""
        additional_service = AdditionalService.objects.create(
            name='Extra Photos',
            description='Additional photos',
            price=Decimal('500.00')
        )
        assert additional_service.name == 'Extra Photos'
        assert additional_service.description == 'Additional photos'
        assert additional_service.price == Decimal('500.00')

    def test_additional_service_str(self, additional_service):
        """Test AdditionalService __str__ method."""
        assert str(additional_service) == additional_service.name

