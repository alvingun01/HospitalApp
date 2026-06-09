# Django Backend Setup Guide (Option A - Auth System)

This guide describes how the Django backend for the **HospitalApp** is set up and outlines how to manage roles and users using Django's built-in authentication system.

---

## 🛠️ Current Project State

The Django backend is located in the [Backend/](file:///Users/alvin/Documents/HospitalApp/Backend) directory and uses the Python virtual environment located in [.HospitalApp/](file:///Users/alvin/Documents/HospitalApp/.HospitalApp).

The following configurations have been completed:
1. **Settings Configured**: Added `api`, `rest_framework` (Django REST Framework), and `corsheaders` to `INSTALLED_APPS` and configured `AUTH_USER_MODEL = 'api.CustomUser'` in [Backend/config/settings.py](file:///Users/alvin/Documents/HospitalApp/Backend/config/settings.py).
2. **CORS Set Up**: Configured `CorsMiddleware` and configured `CORS_ALLOWED_ORIGINS` to allow communication from local development servers (e.g., ports running on `localhost:3000`).
3. **Authentication & Profile Models**: Defined a custom User model (`CustomUser`) extending `AbstractUser` and created specific profile models (`PatientProfile`, `DoctorProfile`, `NurseProfile`) linked via a `OneToOneField` in [Backend/api/models.py](file:///Users/alvin/Documents/HospitalApp/Backend/api/models.py).
4. **Admin Panel Registration**: Registered all models (including custom User configuration) in [Backend/api/admin.py](file:///Users/alvin/Documents/HospitalApp/Backend/api/admin.py) to enable management in Django Admin.

---

## 📋 Recommended Roadmap & Next Steps

### 1. Create a Superuser
To access the Django Admin panel and manage users, doctors, and nurses, create a superuser account:
```bash
.HospitalApp/bin/python Backend/manage.py createsuperuser
```
Follow the interactive prompt to enter your username, email, and password.

---

### 2. Run the Django Server
Start the local development server:
```bash
.HospitalApp/bin/python Backend/manage.py runserver
```
You can now access the admin panel at **`http://127.0.0.1:8000/admin/`** using the superuser credentials you just created.

---

### 3. Create API Serializers
Create a new file `Backend/api/serializers.py` to translate your users and profiles to JSON format:

```python
from rest_framework import serializers
from .models import CustomUser, DoctorProfile, PatientProfile

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role']

class DoctorProfileSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer()

    class Meta:
        model = DoctorProfile
        fields = ['id', 'user', 'specialization', 'experience', 'bio']
```

---

### 4. Create Views & API Endpoints
Create views to handle incoming requests in `Backend/api/views.py`:

```python
from rest_framework import viewsets
from .models import DoctorProfile
from .serializers import DoctorProfileSerializer

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = DoctorProfile.objects.all()
    serializer_class = DoctorProfileSerializer
```

---

### 5. Wire Up the URLs
Map the viewset to a URL route using Django REST Framework's router.

#### A. Create `Backend/api/urls.py`:
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DoctorViewSet

router = DefaultRouter()
router.register(r'doctors', DoctorViewSet, basename='doctor')

urlpatterns = [
    path('', include(router.urls)),
]
```

#### B. Update the main URL configuration [Backend/config/urls.py](file:///Users/alvin/Documents/HospitalApp/Backend/config/urls.py):
Include the `api` app routes under the `/api/` prefix.
```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]
```

---

## 📌 Useful Django Management Commands

Always use the virtual environment python interpreter when running commands:

* **Start Server**: `.HospitalApp/bin/python Backend/manage.py runserver`
* **Create Migrations**: `.HospitalApp/bin/python Backend/manage.py makemigrations`
* **Apply Migrations**: `.HospitalApp/bin/python Backend/manage.py migrate`
* **Create Superuser**: `.HospitalApp/bin/python Backend/manage.py createsuperuser`
* **Shell for Interactive Python**: `.HospitalApp/bin/python Backend/manage.py shell`
