"""
Unit tests for Portfolio and HomePageContent models.
"""
import pytest
from portfolio.models import Portfolio, HomePageContent


@pytest.mark.django_db
class TestPortfolioModel:
    """Test Portfolio model functionality."""

    def test_create_portfolio(self, portfolio):
        """Test creating a portfolio item."""
        assert portfolio.photographer is not None
        assert portfolio.service is not None
        assert portfolio.description is not None

    def test_portfolio_str(self, portfolio):
        """Test Portfolio __str__ method."""
        expected = f"{portfolio.photographer} - {portfolio.description[:20]}"
        assert str(portfolio) == expected


@pytest.mark.django_db
class TestHomePageContentModel:
    """Test HomePageContent model functionality."""

    def test_homepage_content_singleton(self):
        """Test that HomePageContent uses singleton pattern."""
        content1 = HomePageContent.load()
        content2 = HomePageContent.load()
        assert content1.pk == content2.pk == 1

    def test_homepage_content_defaults(self, homepage_content):
        """Test HomePageContent default values."""
        assert homepage_content.title is not None
        assert homepage_content.description is not None
        assert homepage_content.is_active is True

    def test_homepage_content_json_fields(self, homepage_content):
        """Test HomePageContent JSON fields."""
        homepage_content.contact_emails = ['test@example.com']
        homepage_content.contact_phones = ['+380501234567']
        homepage_content.contact_addresses = ['Test Address']
        homepage_content.save()
        homepage_content.refresh_from_db()
        assert isinstance(homepage_content.contact_emails, list)
        assert isinstance(homepage_content.contact_phones, list)
        assert isinstance(homepage_content.contact_addresses, list)

    def test_homepage_content_str(self, homepage_content):
        """Test HomePageContent __str__ method."""
        assert str(homepage_content) == 'Контент головної сторінки'

