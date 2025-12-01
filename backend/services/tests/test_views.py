"""
Integration tests for Service API views.
"""
import pytest
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
class TestServiceList:
    """Test service list endpoint."""

    def test_list_services(self, api_client, service):
        """Test listing all services."""
        # Note: ServiceListView is commented out in urls.py
        # This test is for future use when endpoint is enabled
        pass


@pytest.mark.django_db
class TestServiceDetail:
    """Test service detail endpoint."""

    def test_get_service_detail(self, api_client, service):
        """Test getting service details."""
        # Note: ServiceDetailView is commented out in urls.py
        # This test is for future use when endpoint is enabled
        pass

