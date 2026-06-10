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

---

### Q20: What are `ListCreateAPIView` and `RetrieveUpdateDestroyAPIView`?
In Django REST Framework (DRF), these are **Generic Views** used as an alternative to `ViewSets`. They are built-in, concrete views that combine specific database operations (called Mixins) to reduce boilerplate code.

#### 1. `ListCreateAPIView`
* **Purpose**: Used for collections of data (e.g., list of all doctors).
* **HTTP Methods Allowed**: 
  * `GET` (calls list operation)
  * `POST` (calls create operation)
* **Usually mapped to**: `/api/doctors/`

#### 2. `RetrieveUpdateDestroyAPIView`
* **Purpose**: Used for a specific single record (e.g., one doctor's details).
* **HTTP Methods Allowed**: 
  * `GET` (calls retrieve operation)
  * `PUT` / `PATCH` (calls update/partial_update operations)
  * `DELETE` (calls destroy operation)
* **Usually mapped to**: `/api/doctors/<id>/`

#### ⚖️ ViewSets vs Generic Views:
* **Generic Views** require you to write **two classes** per model (one for the list/create endpoint, and one for the detail/update/delete endpoint) and map their URLs manually in `urls.py`:
  ```python
  # urls.py
  path('doctors/', DoctorListCreateView.as_view()),
  path('doctors/<int:pk>/', DoctorRetrieveUpdateDestroyView.as_view()),
  ```
* **ViewSets** (which we used in our codebase) combine **both classes into a single class** (`DoctorViewSet`) and let Django's `DefaultRouter` automatically generate and bind the URLs for you. This is why ViewSets are often preferred for standard CRUD operations.

---

### Q21: What is the syntax of an AngularJS Factory?
In AngularJS, a **Factory** is used to share code, functions, or data across different parts of your application (like controllers). 

The syntax uses the **Inline Array Annotation** pattern, which is the industry standard because it prevents errors when minifying/obfuscating JavaScript files for production:

```javascript
angular.module("yourModuleName")
  .factory("yourFactoryName", ["dependency1", "dependency2", function(dependency1, dependency2) {
      // 1. Declare private variables or helper logic here
      const privateKey = "xyz123";

      // 2. Define the public API object that will be exposed
      const serviceObject = {
          getData: function() {
              return dependency1.get('/some-endpoint');
          },
          checkKey: function() {
              return privateKey;
          }
      };

      // 3. MANDATORY: A factory MUST return the serviceObject instance
      return serviceObject;
  }]);
```

#### Key Rules:
1. **Module Hook**: `angular.module("yourModuleName")` (without the second argument `[]`) retrieves the already defined module.
2. **Minification Safety**: The array starts with dependency string names (e.g. `"$http"`) and ends with the factory function. The parameters of the function must match the string order.
3. **Return Value**: Unlike an AngularJS `service` (which uses a constructor function and `this`), an AngularJS `factory` is a regular function that **must explicitly return an object** containing the methods/properties you want to share.
---

### Q22: How is Login and Registration implemented in the Django backend?
We set up a secure authentication flow using Django REST Framework's **Token Authentication** (`rest_framework.authtoken`).

#### 1. Setup & Configuration:
* Added `'rest_framework.authtoken'` to `INSTALLED_APPS` in [settings.py](file:///Users/alvin/Documents/HospitalApp/Backend/config/settings.py).
* Set `TokenAuthentication` as the default authentication scheme.
* Ran migrations (`python manage.py migrate`) to create the tokens table.

#### 2. The Login Endpoint (`/api/auth/login/`):
* Defined `LoginView(APIView)` in [views.py](file:///Users/alvin/Documents/HospitalApp/Backend/api/views.py).
* Receives a `username` (email) and `password`.
* Uses Django's `authenticate()` method to safely verify credentials.
* On success, generates or retrieves a unique token using `Token.objects.get_or_create()` and returns both the **token key** and user metadata (ID, email, name, role) back to the frontend.

#### 3. The Registration Endpoint (`/api/auth/register/`):
* Defined `RegisterView(APIView)` in [views.py](file:///Users/alvin/Documents/HospitalApp/Backend/api/views.py).
* Receives `name`, `email`, and `password`.
* Checks if a user already exists with that email.
* Splits the single `name` string into `first_name` and `last_name`.
* Creates the user account using `CustomUser.objects.create_user()` (which encrypts the password securely).
* Automatically instantiates an empty `PatientProfile` linked to the user account.
* Generates an authentication token and returns it alongside the user metadata, automatically logging them in.

---

### Q23: What is `APIView`?
In Django REST Framework (DRF), `APIView` is the base class used to build custom API endpoints. It subclasses Django's standard `View` class but provides enhancements tailored for web APIs:
1. **DRF Request & Response**: It automatically wraps incoming Django HTTP requests into DRF's `Request` object (allowing you to read JSON directly using `request.data`) and handles output formatting through DRF's `Response` object.
2. **HTTP Verb Methods**: Instead of writing conditional statements like `if request.method == 'GET'`, you define clean methods matching HTTP verbs: `def get(self, request):`, `def post(self, request):`, etc.
3. **API Policies**: It allows you to specify custom policies (like permissions, authentication, or throttling rules) as class-level attributes, overriding global settings.

---

### Q24: How do I protect backend endpoints behind authentication?
In DRF, endpoints are protected using **Permission Classes**. Since we set the default authentication scheme to `TokenAuthentication`, we protect our views by requiring requests to have a valid session token:

#### Method 1: Global Protection (Our Implementation)
We set the default permission class to `IsAuthenticated` in **[settings.py](file:///Users/alvin/Documents/HospitalApp/Backend/config/settings.py)**:
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated', # <--- Protects everything by default
    ],
}
```
For public endpoints like Login and Registration, we explicitly override the default by setting `permission_classes = []` directly in the view class in `views.py`.

#### Method 2: Per-View Protection
Alternatively, you can protect individual views or viewsets directly by adding the `permission_classes` attribute to the class:
```python
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = DoctorProfile.objects.all()
    serializer_class = DoctorProfileSerializer
    permission_classes = [IsAuthenticated] # <--- Require authentication for this viewset only
```
When a view is protected, clients must include the token in the HTTP Header of their requests:
`Authorization: Token your_token_key_here`
If the header is missing or the token is invalid, DRF will automatically block the request and return `401 Unauthorized`.

---

### Q25: Why is `permission_classes` set to an empty list `[]` for Login and Register views?
In Python and Django REST Framework, setting `permission_classes = []` serves two main purposes:

1. **Overriding the Global Setting**: 
   Since we defined a global permission setting in `settings.py` (`IsAuthenticated`), DRF protects **every view in the project** by default. Setting `permission_classes = []` on a specific view class tells DRF: *"Do not apply the global default permissions here. Override them with this custom list instead."*

2. **Allowing Public Access**:
   An empty list `[]` means there are **no permission restrictions** on this view. 
   
   This is critical for `/api/auth/login/` and `/api/auth/register/` because a user who is not logged in does not have a token yet. If we did not set `permission_classes = []`, those views would require token authentication to access, meaning users would be locked out from ever logging in or registering!

---

### Q26: How does the frontend handle and send the authorization token?
Yes! That is the standard flow for token-based authentication. The steps are:

#### 1. Save the Token on Login/Register:
When the frontend receives a successful authentication response, it extracts the token and saves it in the browser's **`localStorage`**:
```javascript
// Inside your login/register controller response handler:
localStorage.setItem('authToken', response.data.token);
localStorage.setItem('currentUser', JSON.stringify(response.data.user));
```

#### 2. Attach the Token to Subsequent HTTP Requests:
Every time the frontend calls a protected API endpoint (like fetching doctors or appointments), it must retrieve the token and add it to the **`Authorization`** HTTP header.

In **AngularJS**, you can configure this globally (so you don't have to write it for every `$http` request manually) by setting the default headers during module launch:
```javascript
angular.module("hospitalApp").run(["$http", function($http) {
    const token = localStorage.getItem('authToken');
    if (token) {
        // Automatically attach the token to all future HTTP requests
        $http.defaults.headers.common['Authorization'] = 'Token ' + token;
    }
}]);
```

#### 3. Clear Token on Logout:
When logging out, clear the stored token to end the session:
```javascript
localStorage.removeItem('authToken');
localStorage.removeItem('currentUser');
// Clear the default header
delete $http.defaults.headers.common['Authorization'];
```

---

### Q27: Should I create three separate signup pages for Patients, Doctors, and Nurses?
**No, you should only create one public signup page (for Patients).**

Here is why, from a security and usability perspective:

1. **Patient Signup (Public)**:
   Patients are the general public. They need to be able to visit your site, click "Sign Up", fill out a form, and create their account so they can log in and book appointments. This should have a public route (e.g. `/register` or `/signup`).

2. **Doctor & Nurse Signup (Private / Admin-Managed)**:
   You **must not** let the general public register as doctors or nurses. If you had a public signup page for doctors, anyone could register a fake account, access sensitive medical files, or write fake diagnoses!
   
   Instead, Doctor and Nurse accounts are created inside your system by **Administrators** (using the Django Admin Panel `/admin/` or an admin-only portal). Once the Admin creates the doctor/nurse credentials, the doctor or nurse can log in using the standard, single `/login` page.

---

### Q28: Is the `user` attribute on PatientProfile a "username" field?
**No.** The field definition:
```python
user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='patient_profile')
```
is a **relationship field** (a One-to-One Foreign Key), not a plain text username field.

#### What it does:
1. It links the `PatientProfile` table directly to your `CustomUser` table in the database.
2. It allows you to access user credentials (like their email or password) directly through the profile object using dot notation: `patient_profile.user.username` or `patient_profile.user.email`.
3. Setting `on_delete=models.CASCADE` ensures that if a user account is deleted, their associated patient profile is automatically deleted as well, keeping the database clean.

---

### Q29: How do I configure Django's User model to log in with an email address instead of a username?
To implement email-only authentication while subclassing `AbstractUser`, you configure three main things in your `models.py`:

1. **Redefining Fields**: Set `email` as a unique database field, and override `username` to be unique but optional (`null=True, blank=True`).
2. **Setting the Login Identifier**: Define `USERNAME_FIELD = 'email'` and set `REQUIRED_FIELDS = []`. This instructs Django's authentication system to look up users by their email during login.
3. **Custom User Manager**: Inherit from `BaseUserManager` and write a custom manager class (`CustomUserManager`) that overrides `create_user` and `create_superuser`. Since Django's standard creation commands expect a `username` parameter, the custom manager handles populating the `username` field automatically behind the scenes (for example, duplicating the normalized email value into the username field so internal third-party dependencies don't crash).



