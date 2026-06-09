from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientViewSet, DoctorViewSet, NurseViewSet, AppointmentViewSet

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'doctors', DoctorViewSet, basename='doctor')
router.register(r'nurses', NurseViewSet, basename='nurse')
router.register(r'appointments', AppointmentViewSet, basename='appointment')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
]
