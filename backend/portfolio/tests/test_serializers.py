"""
Unit tests for Portfolio serializers.
"""
import pytest
from portfolio.serializers import PortfolioSerializer, HomePageContentSerializer


@pytest.mark.django_db
class TestPortfolioSerializer:
    """Test PortfolioSerializer functionality."""

    def test_serialize_portfolio(self, portfolio):
        """Test serializing a portfolio item."""
        serializer = PortfolioSerializer(portfolio)
        data = serializer.data
        assert 'service_obj' in data
        assert 'photographer_obj' in data
        assert data['description'] == portfolio.description


@pytest.mark.django_db
class TestHomePageContentSerializer:
    """Test HomePageContentSerializer functionality."""

    def test_serialize_homepage_content(self, homepage_content):
        """Test serializing homepage content."""
        serializer = HomePageContentSerializer(homepage_content)
        data = serializer.data
        assert 'title' in data
        assert 'description' in data
        assert 'contact_emails' in data

