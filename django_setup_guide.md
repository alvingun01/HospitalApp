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

---

## 📚 Q&A: Core Concepts & FAQ

### Q1: Do I need to migrate every time I change the models?
**Yes, if it affects the database schema.**
* **Run migrations** (`makemigrations` and `migrate`) when you:
  * Add, delete, or rename models or fields.
  * Alter field types (e.g. `CharField` to `TextField`).
  * Add default values, change nullability (`null=True`), or add constraints (`unique=True`).
* **No migrations needed** when you:
  * Add or modify methods inside Python classes (e.g., `def __str__(self)`).
  * Change form helper text or validation choices (e.g. `choices=[...]` or `help_text`).

---

### Q2: Can `CharField` be empty?
**Yes.** Use `blank=True` to make it optional in Django forms/admin. 
* By default, Django stores empty text inputs as an **empty string (`""`)** in the database.
* **Avoid `null=True` on string fields** (like `CharField` and `TextField`) to prevent having two ways of showing empty data (`""` and `NULL`). 
* **Exception**: Use `blank=True, null=True` if you also set `unique=True` (e.g. unique optional phone numbers), because databases consider duplicate empty strings `""` as non-unique, but allow multiple `NULL` entries.

---

### Q3: What is the difference between `TextField` and `CharField`?
* **`CharField`**: Used for short, single-line text (names, titles). Maps to SQL `VARCHAR`. Requires `max_length`. Renders as `<input type="text">`.
* **`TextField`**: Used for long, multi-line text (descriptions, bios, diagnoses). Maps to SQL `TEXT`. `max_length` is optional (usually only validated in forms, not in database). Renders as `<textarea>`.

---

### Q4: Why use a single User model with OneToOne profiles instead of individual Patient, Doctor, and Nurse models?
1. **Unified Authentication**: Django’s built-in security and session/token manager require a single User table. If they were separate tables, logging in would require querying multiple tables to find the user.
2. **DRY (Don't Repeat Yourself)**: Avoids duplicating common fields like name, email, password, and login timestamps.
3. **Multi-role Accounts**: Allows a single user account to link to multiple profiles (e.g., a Nurse who also registers as a Patient).

---

### Q5: What is the benefit of a custom `create()` method inside nested serializers?
1. **Consolidated Payload**: The frontend can send account details (username, password) and profile details (specialty, phone) in **one single API call**, rather than registering a user first, getting an ID, and making a second call.
2. **Database Integrity (Atomicity)**: Ensures that if creating the profile fails, the user account creation is also rolled back, preventing orphaned accounts.
3. **Role Enforcement**: Prevents clients from maliciously registering user accounts and setting their own roles (e.g. admin).

---

### Q6: Do we need a custom `create()` method for the `AppointmentSerializer`?
**No.** Because the `Appointment` model uses flat fields and foreign key IDs (`patient`, `doctor`), Django REST Framework’s default serializer creation is already capable of resolving the foreign key relationships and inserting the record into the database automatically.

---

### Q7: What is the use of `views.py`?
In Django/DRF, `views.py` acts as the Controller:
* Receives incoming HTTP requests (GET, POST, etc.).
* Runs logic (queries the database, checks authentication).
* Passes database querysets through serializers to format them as JSON, and returns the HTTP responses.

---

### Q8: What does `queryset = DoctorProfile.objects.all()` do in `views.py`?
It establishes the baseline set of database records that this view is allowed to interact with. DRF uses this queryset to perform all CRUD actions (like fetching all records or filtering for a specific record ID).

---

### Q9: Do router-registered URLs automatically support GET, POST, PUT, DELETE?
**Yes.** When viewsets inheriting from `viewsets.ModelViewSet` are registered with a `DefaultRouter`, DRF automatically configures all standard CRUD endpoints (GET list, POST create, GET detail, PUT update, PATCH partial update, DELETE destroy) without you needing to write separate url patterns.

---

### Q10: How do I restrict a ViewSet to read-only (`GET` only)?
* **Option A**: Inherit from `viewsets.ReadOnlyModelViewSet` instead of `ModelViewSet`.
* **Option B**: Add `http_method_names = ['get']` to your ViewSet class.

---

### Q11: What else can I set a `queryset` as?
You can filter, sort, or optimize queries:
```python
# Filter: Only show unpaid appointments
queryset = Appointment.objects.filter(paid=False)

# Sort: Newest appointments first
queryset = Appointment.objects.all().order_by('-appointment_date')

# Join: Preload linked profile objects (avoids performance issues)
queryset = Appointment.objects.select_related('patient__user', 'doctor__user')
```

---

### Q12: What does `class Meta` do in serializers?
It is an inner class that holds metadata configuration: specifying which `model` the serializer is bound to, and which `fields` from that model should be exposed as JSON.

---

### Q13: What does the `**` do in `**validated_data`?
It is the **dictionary unpacking operator** in Python. It unpacks key-value pairs from a dictionary and passes them as keyword arguments into a function call. For example:
`PatientProfile.objects.create(user=user, **validated_data)`

---

### Q14: Why does `super().create(validated_data)` call the create function inside itself?
It doesn't call itself recursively; it calls the `create` method of the **parent class** (`serializers.ModelSerializer`). This allows Django to execute the standard object creation logic first, after which we can intercept the returned instance to hash the password securely and save it.

---

### Q15: Does the default user have an `id` field?
**Yes.** In Django, if you do not explicitly define a primary key field (a field with `primary_key=True`) on your model, Django automatically creates an auto-incrementing primary key field named `id` behind the scenes. Because your `CustomUser` model inherits from `AbstractUser` (which inherits from Django's base model), it automatically includes this `id` field.

---

### Q16: Why did we initially need to supply `CustomUserSerializer()` as self and `validated_data=user_data` in the profile serializer?
Because we called `CustomUserSerializer.create(...)` directly on the class rather than on an instance of the class. 

In Python, instance methods expect `self` (an instance of the class) as the first argument. Since we called it directly on the class, Python does not automatically bind `self`, meaning we had to create and pass a dummy instance `CustomUserSerializer()` manually.

*(Note: We have since refactored the code to instantiate the serializer first and call the method normally so Python handles `self` automatically:)*
```python
user_serializer = CustomUserSerializer()
user = user_serializer.create(validated_data=user_data)
```

---

### Q17: What are the endpoints I should hit from my frontend?
By utilizing `DefaultRouter` and prefixing your app urls with `api/` in the main routing file, the following RESTful API endpoints are generated and mapped:

| Resource | HTTP Method | URL Path | Action | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Patients** | **GET** | `/api/patients/` | `list` | Retrieve list of all patient profiles |
| | **POST** | `/api/patients/` | `create` | Create a new patient and user account |
| | **GET** | `/api/patients/<id>/` | `retrieve` | Retrieve details of a specific patient |
| | **PUT** | `/api/patients/<id>/` | `update` | Fully update a specific patient |
| | **PATCH** | `/api/patients/<id>/` | `partial_update` | Partially update a patient |
| | **DELETE** | `/api/patients/<id>/` | `destroy` | Delete a patient profile and link |
| **Doctors** | **GET** | `/api/doctors/` | `list` | Retrieve list of all doctor profiles |
| | **POST** | `/api/doctors/` | `create` | Create a new doctor and user account |
| | **GET** | `/api/doctors/<id>/` | `retrieve` | Retrieve details of a specific doctor |
| | **PUT/PATCH**| `/api/doctors/<id>/` | `update` | Update a specific doctor profile |
| | **DELETE** | `/api/doctors/<id>/` | `destroy` | Delete a doctor profile |
| **Nurses** | **GET** | `/api/nurses/` | `list` | Retrieve list of all nurse profiles |
| | **POST** | `/api/nurses/` | `create` | Create a new nurse and user account |
| | **GET/PUT/PATCH/DELETE** | `/api/nurses/<id>/` | CRUD | Retrieve, update, or delete a nurse |
| **Appointments** | **GET** | `/api/appointments/` | `list` | Retrieve list of all appointments |
| | **POST** | `/api/appointments/` | `create` | Create a new appointment |
| | **GET/PUT/PATCH/DELETE** | `/api/appointments/<id>/` | CRUD | Retrieve, update, or delete an appointment |

*(Note: In local development, the full URL will be prefixed with your server's host, e.g., `http://127.0.0.1:8000/api/patients/`)*

---

### Q18: Why is there `/api` in front of the endpoints?
The `/api` prefix is defined in the main URL configuration file: **[Backend/config/urls.py](file:///Users/alvin/Documents/HospitalApp/Backend/config/urls.py)**. 

We included the API app's URLs under this prefix:
```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')), # <--- Here!
]
```

#### Why we do this (Best Practice):
1. **API Namespacing**: It separates your data endpoints (which return raw JSON) from other URLs on your server, such as the Django Admin panel (`/admin/`) or if Django was serving front-end static files/templates at the root (`/`).
2. **Security & Proxy Rules**: In production, it makes it easy for server proxies (like Nginx) or firewalls to identify API traffic (e.g., routing any URL starting with `/api/` to the backend app, while serving static frontend files from storage directly).

---

### Q19: Does the term `ViewSet` mean the model can be "viewed" or "set"?
Not quite! It is a literal translation, but `ViewSet` actually stands for a **"Set of Views"**.

In standard Django, you would have to write multiple individual views (classes or functions) to handle different HTTP actions for a single model:
1. `DoctorListView` (to list all doctors)
2. `DoctorDetailView` (to see one doctor)
3. `DoctorCreateView` (to make a new doctor)
4. `DoctorUpdateView` (to edit a doctor)
5. `DoctorDeleteView` (to delete a doctor)

A **ViewSet** combines all of these related views into **one single class**. It groups operations like `list`, `retrieve`, `create`, `update`, and `destroy` together so you don't have to duplicate configuration files or routing logic.



