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

---

### Q30: Should all profile fields (phone, address, country, etc.) be requested on the registration page?
**No.** It is best practice to keep registration forms as simple as possible to reduce signup friction. 

#### Recommended Design Pattern:
1. **Registration (Minimal Fields)**:
   Only ask for the essentials: **Name, Email, and Password**.
2. **Nullable Profile Database Defaults**:
   Because we configured the fields in `PatientProfile` with **`blank=True`**, they are completely optional. When a user registers, Django automatically creates their profile with empty strings `""` for `phone`, `address`, `city`, etc.
3. **Post-Registration Updates**:
   Once the user is logged in, you can direct them to an **"Account Settings"** or **"My Profile"** page to fill out their contact and address details at their own convenience.

---

### Q31: What if I want all the profile information (phone, address, country, etc.) to be asked on the registration page?
If your design requires users to provide their profile information immediately upon signing up, you can implement this in two steps:

#### 1. Frontend Modifications:
* Add the relevant inputs (`phone`, `address`, `city`, `state`, `zip_code`, `country`) to your registration form in `register.html`.
* Update your angular controller to gather these values and pass them as part of the payload object to the registration service:
  ```javascript
  // httpService.js
  register(name, email, password, profileData) {
      return $http.post(`${BASE_URL}/auth/register/`, {
          name,
          email,
          password,
          phone: profileData.phone,
          address: profileData.address,
          city: profileData.city,
          state: profileData.state,
          zip_code: profileData.zip_code,
          country: profileData.country
      });
  }
  ```

#### 2. Backend Modifications:
* Update `RegisterView` in `views.py` to extract the new profile variables from `request.data`.
* Pass these variables as arguments when calling the `PatientProfile.objects.create` constructor so they are written directly to the database.

*(Note: I have already updated your backend [views.py](file:///Users/alvin/Documents/HospitalApp/Backend/api/views.py) file to support this! The backend is now ready to receive and save these optional profile parameters during registration.)*

---

### Q32: If I did not request profile fields (phone, address, etc.) during registration, when and how are they populated?
If you skip asking for these fields during signup, the lifecycle for filling out these details is handled post-registration:

#### 1. The "When" (User Experience Flow)
The profile gets populated later:
* When the logged-in user visits their **"My Profile"** or **"Account Settings"** page.
* When they attempt an action that requires a phone or address (like booking their first appointment), prompting them to complete their profile before proceeding.

#### 2. The "How" (API Flow)
1. **Initial Creation**: During registration, the backend creates a blank profile containing empty strings `""` for the optional fields:
   ```python
   PatientProfile.objects.create(user=user)
   ```
2. **Editing**: On the profile editing page, the user inputs their details and clicks "Save".
3. **Frontend PUT request**: The frontend grabs these inputs and sends them to the backend using the update endpoints we set up (such as calling `httpService.putPatients(profileId, data)`):
   `PUT /api/patients/<profile_id>/`
   ```json
   {
       "phone": "555-1234",
       "address": "101 Elm St",
       "city": "Dallas",
       "state": "TX",
       "zip_code": "75201",
       "country": "USA"
   }
   ```
4. **Backend Database Save**: DRF's `PatientViewSet` automatically processes the incoming payload, validates it through the serializer, and updates the database row.

---

### Q33: Is it correct syntax to place both `ng-view` and `ng-app` on the `<body>` tag?
**Yes, it is syntactically valid and will work.** 

However, placing them on the same element has a slight design drawback:

```html
<body ng-view ng-app="hospitalApp">
```
* **How it works**: AngularJS will initialize the application on the `<body>` tag, and the router will injection-render the active route template (e.g. `login.html` or `home.html`) directly inside the `<body>`, wiping out anything else inside.
* **The Drawback**: Because the entire body is replaced by the route template, you **cannot** place global visual elements (such as a header/navbar, a footer, or a toast notification system) that should remain visible across *all* page transitions.

#### Recommended Alternative Structure:
Normally, it is better to place `ng-app` on the `<html>` or `<body>` tag, and place `ng-view` inside a separate child container element (like a `<div>`). This lets you build global layouts:

```html
<!DOCTYPE html>
<html lang="en" ng-app="hospitalApp">
<head>
    <!-- script tags... -->
</head>
<body>
    <!-- Global Header/Navbar (Always visible) -->
    <header class="navbar">
        <a href="#!/">Hospital App</a>
        <a href="#!/login">Login</a>
    </header>

    <!-- The active page templates will render here inside ng-view -->
    <main ng-view></main>

    <!-- Global Footer (Always visible) -->
    <footer>
        <p>&copy; 2026 Hospital App</p>
    </footer>
</body>
</html>
```

---

### Q34: How do I run and access a local "Live Server" for the frontend?
Since your frontend is a static AngularJS client located in [Frontend/](file:///Users/alvin/Documents/HospitalApp/Frontend), you need a lightweight web server to serve these static files. Here are the three easiest ways to do it:

#### Method 1: Using the VS Code "Live Server" Extension (Easiest)
If you are using VS Code:
1. Install the extension called **"Live Server"** by Ritwick Dey.
2. Open the [Frontend/index.html](file:///Users/alvin/Documents/HospitalApp/Frontend/index.html) file in your editor.
3. Click the **"Go Live"** button at the bottom-right status bar of VS Code, or right-click anywhere in `index.html` and select **"Open with Live Server"**.
4. Your browser will automatically open your app at: **`http://127.0.0.1:5500/`** (or a similar port).

#### Method 2: Using Python's Built-in HTTP Server
Since you already have Python installed for Django, you can run a static file server directly from your terminal:
1. Open a new terminal window at your project root.
2. Run this command:
   ```bash
   python3 -m http.server --directory Frontend 3000
   ```
3. Open your browser and navigate to: **`http://127.0.0.1:3000/`**

#### Method 3: Using Node / npm (npx)
If you have Node.js installed, you can use the `http-server` package without installing it globally:
1. Open a new terminal window at your project root.
2. Run this command:
   ```bash
   npx http-server Frontend -p 3000
   ```
3. Open your browser and navigate to: **`http://127.0.0.1:3000/`**

---

### Q35: Why is my server displaying a directory file list instead of rendering the webpage?
This happens when your web server is running in the **wrong folder** (like the root `HospitalApp/` folder) rather than inside the `Frontend/` folder.

Web servers automatically search for a file named **`index.html`** to serve as the default home page. If they cannot find it in the directory they are running in, they default to showing a list of all files and folders in that directory (e.g. `Backend/`, `Frontend/`, `README.md`).

#### How to fix it:
* **If you are visiting `http://127.0.0.1:3000/` (and seeing a file list)**:
  Simply click on the **`Frontend`** folder in the list. The URL will change to `http://127.0.0.1:3000/Frontend/` and your app will load.
* **If you are launching the server from the terminal**:
  Make sure you target the `Frontend/` directory:
  ```bash
  # Using Python (targets the Frontend folder)
  python3 -m http.server --directory Frontend 3000
  ```
  Or change directories before running the server:
  ```bash
  cd Frontend
  python3 -m http.server 3000
  ```
* **If using VS Code Live Server**:
  Ensure you have **`Frontend/index.html`** open in your editor when you click the "Go Live" button, or right-click `Frontend/index.html` directly to run the command.

---

### Q36: Why does navigating to `http://127.0.0.1:5500/Frontend/login` show a 404 error?
This occurs because your AngularJS frontend uses **client-side hash routing** (via `ngRoute`).

#### 1. How Client-side Routing Works:
In a Single Page Application (SPA), there is only one real HTML file on the server (`index.html`). When you request `/Frontend/login` directly, the local web server tries to look for a physical folder or file named `/login` inside the `Frontend` directory on your computer. Since that folder doesn't exist, the server returns a **404 Not Found** error.

#### 2. The Solution (Using Hashbangs):
By default, AngularJS watches for route changes using a **hash (`#`)** or **hash-bang (`#!`)** fragment identifier in the URL. Since hash fragments are handled on the client side by JavaScript (not sent to the server), the server only loads `index.html`, and AngularJS parses the fragment to load the correct controller and template.

To access your login page, you must use the hash-bang route:
* If serving from root: **`http://127.0.0.1:5500/#!/login`**
* If serving from the `Frontend` subfolder: **`http://127.0.0.1:5500/Frontend/#!/login`**

---

### Q37: Why does my page show up completely blank when navigating to the root `http://127.0.0.1:5500/Frontend/`?
This is a common AngularJS boot issue caused by **incorrect script loading order** in your `index.html`.

#### The Problem:
* In `app.js`, we **define** the module using the dependency array syntax: 
  `angular.module("hospitalApp", ["ngRoute"])`
* In your controllers and services, we **retrieve** the module: 
  `angular.module("hospitalApp").controller(...)`
* If your `index.html` loads the controllers/services *before* `app.js` runs, AngularJS tries to retrieve a module that doesn't exist yet, causing a fatal `nomod` error in the browser console:
  `Uncaught Error: [$injector:nomod] Module 'hospitalApp' is not available!`
  This crashes the execution thread, resulting in a blank screen.

#### The Solution:
Ensure `app.js` is loaded **first**, before any other custom scripts:
```html
<!-- Load AngularJS framework first -->
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/..."></script>

<!-- Load your app definition second -->
<script src="app.js"></script>

<!-- Finally, load your controllers and services -->
<script src="controller/loginController.js"></script>
<script src="controller/registerController.js"></script>
<script src="service/httpService.js"></script>
```

---

### Q38: Why was my page still blank after fixing the script ordering?
This was caused by a **broken CDN link** for the AngularJS routing library inside `index.html`.

#### The Problem:
The script tag for `angular-route.min.js` was importing the library from `cdnjs`:
`https://cdnjs.cloudflare.com/ajax/libs/angularjs/1.8.2/angular-route.min.js`

This URL returns a **404 Not Found** error, which prevents the routing library from loading. Because the dependency `ngRoute` could not be resolved, AngularJS's initialization sequence crashed completely during startup, resulting in a blank screen.

#### The Solution:
Change the CDN link to use Google's working CDN hosting matching your main `angular.min.js` import:
```html
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.8.2/angular-route.min.js"></script>
```

---

### Q39: Why are some fields (like City, State, and the Create Account button) at the bottom of the registration page cut off and not visible?
This is caused by a well-known **CSS Flexbox/Grid centering overflow bug**.

#### The Problem:
When you center a layout card vertically inside a parent element using `align-items: center` or `place-items: center` along with `min-height: 100vh`, the centering logic assumes the element is smaller than the viewport height. If the content is taller (like the registration form with many input fields), the flex/grid container pushes both the top and bottom of the card off-screen. Because browsers do not support scrolling into negative Y-coordinate space, the bottom of the container becomes permanently cut off.

#### The Solution:
We changed the layout to use a block-level centering approach in `style.css`:
1. Remove flex centering rules from the `body` and set it to a standard block layout (`display: block`).
2. Position the card using native block centering margins: `margin: 60px auto;` on `.auth-container`.
3. This ensures the page grows naturally and native browser scrollbars handle page overflow with 100% reliability.

---

### Q40: Do we need to run the Django backend server first when developing and testing the AngularJS frontend?
Yes, you need **both** the backend and frontend servers running for a fully functional development cycle.
* **Frontend Server** (e.g., Python static server on port 3000): Serves the static HTML, CSS, and AngularJS controller files to the browser.
* **Backend Server** (Django `runserver` on port 8000): Handles all REST API requests (like `/api/auth/register/` and `/api/auth/login/`), reads/writes to the database, and processes validation.

---

### Q41: How do I fix light/white background colors on autofilled form input fields in Chrome and Safari on a dark-themed website?
By default, web browsers apply their own user-agent stylesheets (such as `:-webkit-autofill`) to highlight input fields that have been auto-populated with user details. This forces a white background and dark text.

#### The Solution:
You can override the browser's default autofill styling by using custom CSS selectors:
```css
/* Autofill Styles Override for Chrome/Safari */
input:-webkit-autofill,
input:-webkit-autofill:hover, 
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 1000px #131d35 inset !important;
    -webkit-text-fill-color: var(--text-primary) !important;
    caret-color: var(--text-primary);
    transition: background-color 5000s ease-in-out 0s;
}
```

---

### Q42: Why does VS Code's "Live Server" (port 5500) truncate my AngularJS template partial files, making fields (like Street Address, City, State, etc.) completely missing?
This is a known bug in VS Code's **"Live Server" extension** when handling client-side framework templates (like AngularJS `.html` partial views).

#### The Problem:
1. VS Code's Live Server automatically injects a JavaScript reload script tag into every requested file ending in `.html`.
2. Live Server calculates the HTTP `Content-Length` header based on the **original** file size before injecting the script.
3. Once the reload script is injected, the actual response content size increases.
4. Because the browser receives a `Content-Length` header matching the original smaller file, the browser cuts off the connection early, truncating the last few lines of the file. In `register.html`, this truncation happens right after the "Phone Number" block, cutting off the "Street Address" input field and all fields below it.

#### The Solution:
Run a simple Python static web server that serves the files exactly as they are on disk, without injecting reload scripts:
```bash
# Start python static server on port 3000
python3 -m http.server --directory Frontend --bind 127.0.0.1 3000
```
Open your browser and navigate to: **`http://127.0.0.1:3000/#!/register`**.
This will serve the full, untruncated HTML template, restoring all missing fields!

---

### Q43: How do I run the frontend development server for the HospitalApp?
Since your frontend is a client-side static AngularJS web application, you need a lightweight web server to serve the static files in the [Frontend/](file:///Users/alvin/Documents/HospitalApp/Frontend) directory. Here are the two best options:

#### Option 1: Python Built-in Server (Recommended - Port 3000)
Run this command from your terminal at the root of your project directory:
```bash
python3 -m http.server --directory Frontend --bind 127.0.0.1 3000
```
This binds explicitly to the IPv4 loopback interface on port 3000. You can access it in the browser at: **`http://127.0.0.1:3000/#!/register`**.

#### Option 2: VS Code Live Server Extension (Port 5500)
If you are using the VS Code Live Server extension:
1. Click the "Go Live" button in the bottom right corner of VS Code.
2. In the browser, navigate to: **`http://127.0.0.1:5500/Frontend/#!/register`**.
*(Note: Because of a bug in VS Code's Live Server script injection that truncates AngularJS HTML templates, Option 1 is highly recommended to prevent layout rendering glitches).*

---

### Q44: Is checking for an authentication token in each individual controller the correct approach, and how can it be optimized globally in AngularJS?
Yes, checking if the token exists in local storage and redirecting using `$location.path("/login")` if missing is functionally correct. However, there are a few issues in your current setup that must be resolved, alongside a global best-practice optimization:

#### 1. Setup Issues to Resolve:
1. **Unknown Provider Error**: Your controller defines `authService` in its dependencies, but you have no `authService` registered in the application. This will cause AngularJS to throw a fatal `[$injector:unpr] Unknown provider: authServiceProvider` error and crash your view. Remove it from the parameters.
2. **Missing Script Import**: You need to import `homeController.js` in [index.html](file:///Users/alvin/Documents/HospitalApp/Frontend/index.html):
   ```html
   <script src="controller/homeController.js"></script>
   ```
3. **Route Linkage**: Ensure you bind the controller to the home route in [app.js](file:///Users/alvin/Documents/HospitalApp/Frontend/app.js):
   ```javascript
   .when("/", {
       templateUrl: "views/home.html",
       controller: "HomeController"
   })
   ```

#### 2. Global Optimization (Best Practice):
Instead of copying this block into every controller for private pages, you can register a global `$routeChangeStart` listener inside a `.run()` block in [app.js](file:///Users/alvin/Documents/HospitalApp/Frontend/app.js):

```javascript
app.run(["$rootScope", "$location", function($rootScope, $location) {
    $rootScope.$on("$routeChangeStart", function(event, next, current) {
        const token = localStorage.getItem("token");
        const isPublicRoute = next && (next.templateUrl === "views/login.html" || next.templateUrl === "views/register.html");
        
        if (!token && !isPublicRoute) {
            // Redirect to login if user is not authenticated and attempts to access a protected page
            $location.path("/login");
        }
    });
}]);
```
This automatically protects all routes except login and registration, keeping your controllers clean.

---

### Q45: How does the AngularJS global route guard in `app.run()` work line-by-line?
This code acts as a centralized authentication checkpoint that protects non-public pages from guest users:

```javascript
app.run(["$rootScope", "$location", function ($rootScope, $location) {
    $rootScope.$on("$routeChangeStart", function (event, next, current) {
        const token = localStorage.getItem("token");
        const isPublicRoute = next && (next.templateUrl === "views/login.html" || next.templateUrl === "views/register.html");

        if (!token && !isPublicRoute) {
            $location.path("/login");
        }
    });
}]);
```

#### Detailed Line-by-Line Explanation:
1. **`app.run(...)`**:
   The `run` block acts like a "main" method in standard languages. It executes immediately after the AngularJS application bootstraps and configures its routes.
2. **`$rootScope.$on("$routeChangeStart", ...)`**:
   * `$rootScope` is the master parent scope of the entire application.
   * `$on` is a listener registering system.
   * `"$routeChangeStart"` is a built-in event broadcasted by `ngRoute` right *before* transitioning to a new view template. It receives the destination route config (`next`) and the origin route config (`current`).
3. **`const token = localStorage.getItem("token");`**:
   Attempts to retrieve the authorization token from the browser's persistent storage. Returns `null` if the user is not authenticated.
4. **`const isPublicRoute = next && ...`**:
   Checks if the target template we are navigating to (`next.templateUrl`) is either the login page or the register page. These views must remain accessible to non-authenticated users.
5. **`if (!token && !isPublicRoute) { $location.path("/login"); }`**:
   If the user has **no token** (unauthenticated) **and** is trying to access a protected dashboard route, the transition is intercepted and redirected back to the login path (`/login`).

---

### Q46: Why am I getting a CORS policy block error when trying to call the Django backend REST APIs from my local AngularJS frontend, and how do I fix it?
CORS (Cross-Origin Resource Sharing) is a security mechanism enforced by web browsers to prevent unauthorized cross-origin requests. A CORS error occurs when your frontend client (e.g. running on `http://127.0.0.1:3000`) tries to make an API request to a different host/port (e.g. `http://localhost:8000`), and the server does not explicitly authorize that origin in its response headers.

#### How to Fix It:
1. **Enable corsheaders in Django settings**:
   Ensure `django-cors-headers` is installed in your python environment, added to `INSTALLED_APPS`, and placed at the very top of the `MIDDLEWARE` list in [settings.py](file:///Users/alvin/Documents/HospitalApp/Backend/config/settings.py).
2. **Configure Allowed Origins**:
   Add the exact URL configurations of your frontend server(s) to `CORS_ALLOWED_ORIGINS` inside [settings.py](file:///Users/alvin/Documents/HospitalApp/Backend/config/settings.py):
   ```python
   CORS_ALLOWED_ORIGINS = [
       "http://localhost:3000",
       "http://127.0.0.1:3000",
       "http://localhost:5500",
       "http://127.0.0.1:5500",
   ]
   ```
3. **Restart the Backend Server**:
   If settings are updated but you still receive a CORS error, the active backend server process is likely running on a cached configuration. You must find the process ID and restart it:
   ```bash
   # Find process ID on port 8000
   lsof -i :8000
   
   # Kill the process
   kill -9 <PID>
   
   # Start the Django server fresh
   .HospitalApp/bin/python Backend/manage.py runserver
   ```
   A clean start forces Django to read the updated settings and successfully append the `Access-Control-Allow-Origin` header to preflight options.

---

### Q47: How do I create a superuser to access the Django Admin Panel, and where is the admin panel hosted?
To log in and manage the database models (users, patient profiles, doctors, nurses, appointments) via Django's built-in Admin Panel, you need to register an administrator user:

#### 1. Create the Admin Superuser:
Run the interactive setup script in your terminal from the root folder:
```bash
.HospitalApp/bin/python Backend/manage.py createsuperuser
```
Follow the prompts to configure:
* **Username** (optional depending on CustomUser config)
* **Email address**
* **Password** (and password confirmation)

#### 2. Access the Admin Panel:
1. Ensure the Django server is running:
   ```bash
   .HospitalApp/bin/python Backend/manage.py runserver
   ```
2. Open your browser and navigate to:
   👉 **`http://127.0.0.1:8000/admin/`**
3. Log in using the email and password credentials you configured in step 1.

---

### Q48: What should I do if I forgot my Django superuser credentials (username/email or password)?
If you forget your credentials, you have two quick options to regain access:

#### Option 1: Create a New Superuser (Fastest)
Django allows you to have multiple superuser accounts. You can simply create a new one:
```bash
.HospitalApp/bin/python Backend/manage.py createsuperuser
```
Follow the prompts to configure a new email and password, and use those to log in to `/admin/`.

#### Option 2: Reset the Password of the Existing Superuser via Django Shell
If you want to keep using the same email address but forgot the password:
1. Open the Django interactive shell:
   ```bash
   .HospitalApp/bin/python Backend/manage.py shell
   ```
2. Run the following Python commands inside the shell:
   ```python
   # 1. Import your custom User model
   from api.models import CustomUser
   
   # 2. (Optional) List all superusers to find the correct email
   superusers = CustomUser.objects.filter(is_superuser=True)
   for user in superusers:
       print(user.email)
       
   # 3. Retrieve the target superuser by email
   admin_user = CustomUser.objects.get(email="your-admin-email@example.com")
   
   # 4. Set a new password
   admin_user.set_password("your_new_password_here")
   
   # 5. Save the changes to the database
   admin_user.save()
   
   # 6. Exit the shell
   exit()
   ```
3. You can now log in to the admin panel with the new password.

---

### Q49: How are secondary and danger buttons (like the logout button) styled in the HospitalApp?
To create a premium look, the CSS has distinct button styles defined in [Frontend/css/style.css](file:///Users/alvin/Documents/HospitalApp/Frontend/css/style.css) for non-primary actions:

#### 1. Secondary Button (`.btn-secondary`)
Used for neutral actions, outline design, transparent background, and subtle hover borders.
```css
.btn-secondary {
    padding: 10px 20px;
    background: transparent;
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}
.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--text-secondary);
}
```

#### 2. Danger Button (`.btn-danger`)
Used for destructive actions like "Logout" or deletion. It uses a low-opacity red background that turns solid red on hover.
```css
.btn-danger {
    padding: 10px 20px;
    background: rgba(239, 68, 68, 0.15);
    color: var(--error);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}
.btn-danger:hover {
    background: var(--error);
    color: #fff;
    border-color: var(--error);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}
```
These classes can be combined with SVG icons inside the markup to give a premium, polished feel.

---

### Q50: How is the password visibility toggle implemented using AngularJS and CSS?
To implement a clean, integrated password toggle that displays inside the password textbox without breaking layout rules:

1. **AngularJS State**:
   We initialize `showPassword = false` on the scope (e.g., inside `loginController.js` and `registerController.js`), and define a function `togglePassword()` to flip the boolean value:
   ```javascript
   $scope.showPassword = false;
   $scope.togglePassword = function() {
       $scope.showPassword = !$scope.showPassword;
   };
   ```

2. **Dynamic HTML Attribute (`ng-attr-type`)**:
   We bind the input `type` dynamically using AngularJS's `ng-attr-type` directive. This dynamically switches the DOM attribute between `'password'` (obscured) and `'text'` (visible) without recreating the input element:
   ```html
   <input ng-attr-type="{{ showPassword ? 'text' : 'password' }}" class="form-input" />
   ```

3. **Styling Wrapper & Absolute Positioning (CSS)**:
   We wrap the input and the eye toggle button inside a relative container (`.password-wrapper`) and position the toggle button absolutely:
   ```css
   .password-wrapper {
       position: relative;
       width: 100%;
       display: flex;
       align-items: center;
   }
   
   .password-wrapper .form-input {
       padding-right: 48px; /* Prevents text from flowing behind the eye icon */
   }
   
   .password-toggle {
       position: absolute;
       right: 12px;
       background: none;
       border: none;
       color: var(--text-secondary);
       cursor: pointer;
       padding: 6px;
       display: flex;
       align-items: center;
       justify-content: center;
       transition: var(--transition);
       border-radius: 6px;
       z-index: 10;
   }
   ```

4. **Toggle SVG Icons**:
   We place two SVGs inside the button, showing and hiding them using `ng-if="!showPassword"` (eye icon) and `ng-if="showPassword"` (slashed eye icon) to visually indicate the state.

