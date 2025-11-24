from django.urls import path
from .views import BookingCreateView, AvailableSlotsView, AvailableDatesView, MyBookingsView, BookingUpdateView, BookingListView, BookingListCreateView, PhotographerBookingsView, UploadBookingResultsView, SendResultsEmailView

urlpatterns = [
    path('my/', MyBookingsView.as_view(), name='my-bookings'),
    path('photographer/', PhotographerBookingsView.as_view(), name='photographer-bookings'),
    path('available_slots/', AvailableSlotsView.as_view(), name='available-slots'),
    path('available_dates/', AvailableDatesView.as_view(), name='available-dates'),
    path('<int:booking_id>/upload_results/', UploadBookingResultsView.as_view(), name='upload-booking-results'),
    path('<int:booking_id>/send_results_email/', SendResultsEmailView.as_view(), name='send-results-email'),
    path('<int:pk>/', BookingUpdateView.as_view(), name='booking-update'),
    path('', BookingListCreateView.as_view(), name='booking-list-create'),
]
