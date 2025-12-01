"""
Integration tests for User API views.
"""
import pytest
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
class TestUserRegistration:
    """Test user registration endpoint."""

    def test_register_user(self, api_client):
        """Test registering a new user."""
        url = reverse('register')
        data = {
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'first_name': 'New',
            'last_name': 'User'
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['email'] == 'newuser@example.com'
        assert 'password' not in response.data

    def test_register_duplicate_email(self, api_client, user):
        """Test registering with duplicate email."""
        url = reverse('register')
        data = {
            'email': user.email,
            'password': 'newpass123'
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestUserProfile:
    """Test user profile endpoints."""

    def test_get_my_profile(self, authenticated_api_client, user):
        """Test getting current user profile."""
        url = reverse('user-me')
        response = authenticated_api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == user.email

    def test_get_profile_unauthorized(self, api_client):
        """Test getting profile without authentication."""
        url = reverse('user-me')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_my_profile(self, authenticated_api_client, user):
        """Test updating current user profile."""
        url = reverse('user-me')
        data = {
            'first_name': 'Updated',
            'last_name': 'Name'
        }
        response = authenticated_api_client.patch(url, data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == 'Updated'
        user.refresh_from_db()
        assert user.first_name == 'Updated'

