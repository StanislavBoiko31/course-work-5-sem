"""
Unit tests for Photographer serializers.
"""
import pytest
from photographers.serializers import PhotographerSerializer, PhotographerShortSerializer


@pytest.mark.django_db
class TestPhotographerSerializer:
    """Test PhotographerSerializer functionality."""

    def test_serialize_photographer(self, photographer, service):
        """Test serializing a photographer."""
        photographer.services.add(service)
        serializer = PhotographerSerializer(photographer)
        data = serializer.data
        assert 'user' in data
        assert 'services' in data
        assert data['bio'] == photographer.bio

    def test_photographer_short_serializer(self, photographer):
        """Test PhotographerShortSerializer."""
        serializer = PhotographerShortSerializer(photographer)
        data = serializer.data
        assert 'id' in data
        assert 'user' in data
        assert 'photo' in data
        assert 'bio' not in data  # Should not include bio

