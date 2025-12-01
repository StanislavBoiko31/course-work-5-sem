"""
Unit tests for Service serializers.
"""
import pytest
from services.serializers import ServiceSerializer, AdditionalServiceSerializer


@pytest.mark.django_db
class TestServiceSerializer:
    """Test ServiceSerializer functionality."""

    def test_serialize_service(self, service, photographer):
        """Test serializing a service."""
        service.photographers.add(photographer)
        serializer = ServiceSerializer(service)
        data = serializer.data
        assert data['name'] == service.name
        assert data['description'] == service.description
        assert 'photographers' in data
        assert len(data['photographers']) == 1


@pytest.mark.django_db
class TestAdditionalServiceSerializer:
    """Test AdditionalServiceSerializer functionality."""

    def test_serialize_additional_service(self, additional_service):
        """Test serializing an additional service."""
        serializer = AdditionalServiceSerializer(additional_service)
        data = serializer.data
        assert data['name'] == additional_service.name
        assert data['price'] == str(additional_service.price)

