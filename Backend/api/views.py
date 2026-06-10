from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.db import transaction

from .models import CustomUser, PatientProfile, DoctorProfile, NurseProfile, Appointment
from .serializers import (
    PatientProfileSerializer, 
    DoctorProfileSerializer, 
    NurseProfileSerializer, 
    AppointmentSerializer
)

# --- ViewSets for CRUD Operations ---

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


# --- Authentication Views ---

class LoginView(APIView):
    """
    API View to handle user authentication and return a token + user role.
    """
    permission_classes = []  # Allow unauthenticated users to access this endpoint

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        # Authenticate user credentials
        user = authenticate(username=username, password=password)
        if user is not None:
            # Generate or retrieve token
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': user.role
                }
            }, status=status.HTTP_200_OK)
        
        return Response({'error': 'Invalid username or password'}, status=status.HTTP_400_BAD_REQUEST)


class RegisterView(APIView):
    """
    API View to handle user registration (defaults to Patient profile).
    """
    permission_classes = []  # Allow unauthenticated users to register

    def post(self, request):
        name = request.data.get('name', '')
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user already exists (using email as username)
        if CustomUser.objects.filter(username=email).exists():
            return Response({'error': 'A user with this email address already exists'}, status=status.HTTP_400_BAD_REQUEST)

        # Parse name into first and last name
        name_parts = name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        try:
            with transaction.atomic():
                # 1. Create the CustomUser instance using create_user (hashes password)
                user = CustomUser.objects.create_user(
                    username=email,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    role='patient'  # Default role is Patient
                )
                
                # 2. Create the associated PatientProfile record
                PatientProfile.objects.create(user=user)
                
                # 3. Create authentication token
                token, _ = Token.objects.get_or_create(user=user)

                return Response({
                    'token': token.key,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role
                    }
                }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
