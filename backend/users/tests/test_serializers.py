"""
Unit tests for User serializers.
"""
import pytest
from rest_framework.exceptions import ValidationError
from users.serializers import UserSerializer
from users.models import User


@pytest.mark.django_db
class TestUserSerializer:
    """Test UserSerializer functionality."""

    def test_serialize_user(self, user):
        """Test serializing a user."""
        serializer = UserSerializer(user)
        data = serializer.data
        assert data['email'] == user.email
        assert data['first_name'] == user.first_name
        assert data['last_name'] == user.last_name
        assert 'password' not in data  # password should be write_only

    def test_create_user(self):
        """Test creating a user through serializer."""
        data = {
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'first_name': 'New',
            'last_name': 'User'
        }
        serializer = UserSerializer(data=data)
        assert serializer.is_valid()
        user = serializer.save()
        assert user.email == 'newuser@example.com'
        assert user.check_password('newpass123')

    def test_update_user(self, user):
        """Test updating a user through serializer."""
        data = {
            'first_name': 'Updated',
            'last_name': 'Name'
        }
        serializer = UserSerializer(user, data=data, partial=True)
        assert serializer.is_valid()
        updated_user = serializer.save()
        assert updated_user.first_name == 'Updated'
        assert updated_user.last_name == 'Name'

    def test_update_user_password(self, user):
        """Test updating user password."""
        old_password_hash = user.password
        data = {'password': 'newpassword123'}
        serializer = UserSerializer(user, data=data, partial=True)
        assert serializer.is_valid()
        updated_user = serializer.save()
        assert updated_user.password != old_password_hash
        assert updated_user.check_password('newpassword123')

