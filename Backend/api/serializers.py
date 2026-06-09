from rest_framework import serializers
from .models import CustomUser, PatientProfile, DoctorProfile, NurseProfile

# 1. Base User Serializer (Handles shared fields like username, email, names, role)
class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

# 2. Patient Profile Serializer
class PatientProfileSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer()

    class Meta:
        model = PatientProfile
        fields = ['id', 'user', 'phone', 'address', 'city', 'state', 'zip_code', 'country']

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user_data['role'] = 'patient'
        
        # Instantiate serializer and call create normally
        user_serializer = CustomUserSerializer()
        user = user_serializer.create(validated_data=user_data)
        
        patient_profile = PatientProfile.objects.create(user=user, **validated_data)
        return patient_profile

# 3. Doctor Profile Serializer
class DoctorProfileSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer()

    class Meta:
        model = DoctorProfile
        fields = ['id', 'user', 'specialization', 'experience', 'bio']

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user_data['role'] = 'doctor'
        
        # Instantiate serializer and call create normally
        user_serializer = CustomUserSerializer()
        user = user_serializer.create(validated_data=user_data)
        
        doctor_profile = DoctorProfile.objects.create(user=user, **validated_data)
        return doctor_profile

# 4. Nurse Profile Serializer
class NurseProfileSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer()

    class Meta:
        model = NurseProfile
        fields = ['id', 'user', 'shift', 'bio']

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user_data['role'] = 'nurse'
        
        # Instantiate serializer and call create normally
        user_serializer = CustomUserSerializer()
        user = user_serializer.create(validated_data=user_data)
        
        nurse_profile = NurseProfile.objects.create(user=user, **validated_data)
        return nurse_profile

# 5. Appointment Serializer
from .models import Appointment

class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'doctor', 'appointment_date', 'appointment_status', 'diagnosis', 'total_bills', 'paid', 'created_at', 'updated_at']