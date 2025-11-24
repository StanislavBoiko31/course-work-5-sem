from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Portfolio, HomePageContent
from .serializers import PortfolioSerializer, HomePageContentSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from users.views import IsAdminPermission

# Create your views here.

class PortfolioViewSet(viewsets.ModelViewSet):
    queryset = Portfolio.objects.all()
    serializer_class = PortfolioSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated()]
        return super().get_permissions()

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        # Адмін бачить все, фотограф — лише своє
        if user.is_authenticated and hasattr(user, "role") and user.role == "photographer":
            photographer = getattr(user, "photographer", None)
            if photographer:
                queryset = queryset.filter(photographer=photographer)
        # Додаємо фільтрацію по активності фотографа
        queryset = queryset.filter(photographer__user__is_active=True)
        service_id = self.request.query_params.get('service')
        photographer_id = self.request.query_params.get('photographer')
        if service_id:
            queryset = queryset.filter(service_id=service_id)
        if photographer_id:
            queryset = queryset.filter(photographer_id=photographer_id)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, "role") and user.role == "photographer":
            photographer = getattr(user, "photographer", None)
            serializer.save(photographer=photographer)
        else:
            serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()
        if hasattr(user, "role") and user.role == "photographer":
            if instance.photographer != getattr(user, "photographer", None):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Ви можете редагувати лише свої роботи")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if hasattr(user, "role") and user.role == "photographer":
            if instance.photographer != getattr(user, "photographer", None):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Ви можете видаляти лише свої роботи")
        instance.delete()

class PortfolioMyViewSet(viewsets.ModelViewSet):
    serializer_class = PortfolioSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "role") and user.role == "photographer":
            photographer = getattr(user, "photographer", None)
            return Portfolio.objects.filter(photographer=photographer)
        return Portfolio.objects.none()
    def perform_create(self, serializer):
        user = self.request.user
        photographer = getattr(user, "photographer", None)
        serializer.save(photographer=photographer)


class HomePageContentView(APIView):
    """
    API для отримання та оновлення контенту головної сторінки.
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Отримати контент головної сторінки (публічний доступ)"""
        content = HomePageContent.load()
        serializer = HomePageContentSerializer(content)
        return Response(serializer.data)
    
    def put(self, request):
        """Оновити контент головної сторінки (тільки для адміністратора)"""
        if not request.user.is_authenticated or not hasattr(request.user, 'role') or request.user.role != 'admin':
            return Response({"detail": "Тільки адміністратор може редагувати контент"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            content = HomePageContent.load()
            
            # Переконуємося, що списки є списками
            data = request.data.copy()
            if 'contact_emails' in data and not isinstance(data['contact_emails'], list):
                data['contact_emails'] = []
            if 'contact_phones' in data and not isinstance(data['contact_phones'], list):
                data['contact_phones'] = []
            if 'contact_addresses' in data and not isinstance(data['contact_addresses'], list):
                data['contact_addresses'] = []
            
            serializer = HomePageContentSerializer(content, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            print(f"Помилка при оновленні контенту: {e}")
            print(traceback.format_exc())
            return Response({"detail": f"Помилка сервера: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def patch(self, request):
        """Часткове оновлення контенту (тільки для адміністратора)"""
        return self.put(request)
