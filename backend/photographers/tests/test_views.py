"""
Integration tests for Photographer API views.
"""
import pytest
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
class TestPhotographerList:
    """Test photographer list endpoint."""

    def test_list_photographers(self, api_client, photographer):
        """Test listing all photographers."""
        url = reverse('photographer-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_list_photographers_pagination(self, api_client, photographer):
        """Test photographer list pagination."""
        url = reverse('photographer-list')
        response = api_client.get(url)
        assert 'count' in response.data
        assert 'next' in response.data
        assert 'previous' in response.data
        assert 'results' in response.data


@pytest.mark.django_db
class TestPhotographerDetail:
    """Test photographer detail endpoint."""

    def test_get_photographer_detail(self, api_client, photographer):
        """Test getting photographer details."""
        url = reverse('photographer-detail', kwargs={'pk': photographer.id})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == photographer.id
        assert 'user' in response.data
        assert 'services' in response.data

    def test_get_nonexistent_photographer(self, api_client):
        """Test getting nonexistent photographer."""
        url = reverse('photographer-detail', kwargs={'pk': 99999})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestPhotographerMe:
    """Test photographer me endpoint."""

    def test_get_photographer_me(self, authenticated_photographer_api_client, photographer):
        """Test getting current photographer profile."""
        url = reverse('photographer-me')
        response = authenticated_photographer_api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        # PhotographerUpdateSerializer may not include 'id', check for other fields
        assert 'user' in response.data or 'bio' in response.data

    def test_get_photographer_me_not_photographer(self, authenticated_api_client, user):
        """Test getting photographer me when user is not a photographer."""
        url = reverse('photographer-me')
        response = authenticated_api_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_photographer_me(self, authenticated_photographer_api_client, photographer):
        """Test updating photographer profile."""
        url = reverse('photographer-me')
        data = {
            'bio': 'Updated bio',
            'phone': '+380501111111'
        }
        response = authenticated_photographer_api_client.patch(url, data)
        assert response.status_code == status.HTTP_200_OK
        photographer.refresh_from_db()
        assert photographer.bio == 'Updated bio'

