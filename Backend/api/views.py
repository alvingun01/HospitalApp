from rest_framework import viewsets
from .models import PatientProfile, DoctorProfile, NurseProfile, Appointment
from .serializers import (
    PatientProfileSerializer, 
    DoctorProfileSerializer, 
    NurseProfileSerializer, 
    AppointmentSerializer
)

class PatientViewSet(viewsets.ModelViewSet):
    """
    API view to handle CRUD operations for Patient Profiles.
    """
    queryset = PatientProfile.objects.all()
    serializer_class = PatientProfileSerializer

class DoctorViewSet(viewsets.ModelViewSet):
    """
    API view to handle CRUD operations for Doctor Profiles.
    """
    queryset = DoctorProfile.objects.all()
    serializer_class = DoctorProfileSerializer

class NurseViewSet(viewsets.ModelViewSet):
    """
    API view to handle CRUD operations for Nurse Profiles.
    """
    queryset = NurseProfile.objects.all()
    serializer_class = NurseProfileSerializer

class AppointmentViewSet(viewsets.ModelViewSet):
    """
    API view to handle CRUD operations for Appointments.
    """
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
