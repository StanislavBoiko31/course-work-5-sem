"""
Unit tests for User model.
"""
import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

User = get_user_model()


@pytest.mark.django_db
class TestUserModel:
    """Test User model functionality."""

    def test_create_user(self):
        """Test creating a regular user."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        assert user.email == 'test@example.com'
        assert user.check_password('testpass123')
        assert user.is_active is True
        assert user.is_staff is False
        assert user.role == 'user'

    def test_create_user_without_email(self):
        """Test that creating user without email raises error."""
        with pytest.raises(ValueError, match='Email is required'):
            User.objects.create_user(email='', password='testpass123')

    def test_create_superuser(self):
        """Test creating a superuser."""
        superuser = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123'
        )
        assert superuser.email == 'admin@example.com'
        assert superuser.is_staff is True
        assert superuser.is_superuser is True

    def test_user_str(self):
        """Test User __str__ method."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        assert str(user) == 'test@example.com'

    def test_user_personal_discount_default(self):
        """Test that personal_discount has default value."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        assert user.personal_discount == 5.00

    def test_user_role_choices(self):
        """Test user role choices."""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            role='photographer'
        )
        assert user.role == 'photographer'

    def test_user_email_unique(self):
        """Test that email must be unique."""
        User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        with pytest.raises(Exception):  # IntegrityError
            User.objects.create_user(
                email='test@example.com',
                password='testpass123'
            )

