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

---

### Q51: How do I group and size action buttons (like Make Appointment and Logout) inside a header navigation bar?
To group action buttons side-by-side on the right of the header while keeping them sized properly:

1. **Flex Action Group (`.nav-actions`)**:
   We wrap the buttons in a dedicated container styled with flexbox and a uniform gap to align them:
   ```css
   .nav-actions {
       display: flex;
       align-items: center;
       gap: 12px;
   }
   ```

2. **Inline Button Sizing Modifier (`.btn-sm`)**:
   Instead of using standard block-level buttons (`width: 100%`), we apply a modifier class `.btn-sm` on the primary button:
   ```css
   .btn-primary.btn-sm {
       width: auto;
       padding: 10px 20px;
       font-size: 14px;
       font-weight: 500;
       margin-top: 0;
       display: inline-flex;
       align-items: center;
       justify-content: center;
       gap: 8px;
       box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
   }
   ```
   This overrides default block layout properties, making it compact and aligned with other secondary or danger buttons.

---

### Q52: Why am I getting 401 Unauthorized errors on API calls even after logging in, and how do I attach the token globally?
A `401 Unauthorized` response occurs when the Django backend expects an authorization header (e.g. `Authorization: Token <key>`) but the frontend client fails to include it in the request.

#### The Solution (AngularJS HTTP Interceptor):
Rather than manually attaching the headers on every single `$http` call across controllers, the best practice is to configure a global **HTTP Interceptor** inside [app.js](file:///Users/alvin/Documents/HospitalApp/Frontend/app.js):

1. **Define the Interceptor Factory**:
   ```javascript
   app.factory("authInterceptor", ["$q", "$location", function ($q, $location) {
       return {
           // Intercepts outgoing requests to append the authorization header
           request: function (config) {
               const token = localStorage.getItem("token");
               if (token) {
                   config.headers['Authorization'] = 'Token ' + token;
               }
               return config;
           },
           // Intercepts response errors (e.g., if a token expires/is deleted)
           responseError: function (rejection) {
               if (rejection.status === 401) {
                   localStorage.removeItem("token");
                   localStorage.removeItem("user");
                   $location.path("/login");
               }
               return $q.reject(rejection);
           }
       };
   }]);
   ```

2. **Register Interceptor with `$httpProvider`**:
   ```javascript
   app.config(["$routeProvider", "$httpProvider", function ($routeProvider, $httpProvider) {
       $httpProvider.interceptors.push("authInterceptor");
       // route setups...
   }]);
   ```
This automatically handles header injection for every outbound endpoint and handles session expiry redirects in one centralized block.

### Q53: How do I implement a side-by-side comparison layout for upcoming and previous appointments in AngularJS without tables?
To implement a side-by-side responsive grid columns layout:

1. **Backend Mapping & Partitioning (JavaScript Controller)**:
   In the controller, load the data from your backend. Map the doctor name onto the appointment using a lookup dictionary. Then, separate appointments by comparing the dates to the current system time:
   ```javascript
   const now = new Date();
   
   // Partition and Sort (upcoming: nearest first, previous: newest first)
   $scope.upcomingAppointments = patientApps
       .filter(app => new Date(app.appointment_date) >= now)
       .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

   $scope.previousAppointments = patientApps
       .filter(app => new Date(app.appointment_date) < now)
       .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));
   ```

2. **Mount side-by-side list columns (HTML)**:
   Create a grid container (`.dashboard-columns`) and define two columns (`.dashboard-col`). Inside each list, iterate over the partition lists directly using `ng-repeat`, mounting the custom `<patient-app-card>` component:
   ```html
   <div class="dashboard-columns">
       <!-- Column 1: Upcoming -->
       <div class="dashboard-col">
           <h2 class="col-heading">Upcoming Appointments</h2>
           <div class="appointments-list">
               <patient-app-card ng-repeat="app in upcomingAppointments" appointment="app"></patient-app-card>
               <div class="no-app-placeholder" ng-if="upcomingAppointments.length === 0">
                   No upcoming appointments scheduled.
               </div>
           </div>
       </div>

       <!-- Column 2: Previous -->
       <div class="dashboard-col">
           <h2 class="col-heading">Previous Appointments</h2>
           <div class="appointments-list">
               <patient-app-card ng-repeat="app in previousAppointments" appointment="app"></patient-app-card>
               <div class="no-app-placeholder" ng-if="previousAppointments.length === 0">
                   No previous appointment history.
               </div>
           </div>
       </div>
   </div>
   ```

3. **Styling Responsive Columns (CSS)**:
   Define the grid behavior to display side-by-side on larger viewports and stack vertically on screens narrower than `768px`:
   ```css
   .dashboard-columns {
       display: grid;
       grid-template-columns: 1fr 1fr;
       gap: 24px;
       margin-top: 24px;
       width: 100%;
   }

   @media (max-width: 768px) {
       .dashboard-columns {
           grid-template-columns: 1fr;
           gap: 20px;
       }
   }
   ```

---

### Q54: Why does calling `.split()` on the model bound to `<input type="time">` throw a TypeError in AngularJS?
In AngularJS (versions 1.3+), inputs of type `date`, `time`, and `datetime-local` do **not** bind to plain ISO string values in the model. Instead, AngularJS parses their values and binds them to native JavaScript **`Date` objects** (with `date` representing the chosen calendar day, and `time` representing a `Date` instance with date components set to Jan 1, 1970).

Because native `Date` objects do not possess the String helper `.split()` function, calling it directly throws a `TypeError: ...split is not a function`.

#### The Solution (Polymorphic Date/Time Merger):
To merge distinct `<input type="date">` and `<input type="time">` models safely without type crashes, build a check that accommodates both native `Date` instances and raw strings:
```javascript
// 1. Instantiate date object
const dateObj = new Date($scope.appointment.appointmentDate);

let hours = 0;
let minutes = 0;

// 2. Extract hours/minutes safely depending on the bound type
if ($scope.appointment.appointmentTime instanceof Date) {
    hours = $scope.appointment.appointmentTime.getHours();
    minutes = $scope.appointment.appointmentTime.getMinutes();
} else if (typeof $scope.appointment.appointmentTime === "string") {
    const timeParts = $scope.appointment.appointmentTime.split(":");
    hours = parseInt(timeParts[0], 10) || 0;
    minutes = parseInt(timeParts[1], 10) || 0;
}

// 3. Update the date object time fields
dateObj.setHours(hours);
dateObj.setMinutes(minutes);
dateObj.setSeconds(0);
```
This is fully cross-browser compatible and prevents model type changes from crashing execution threads.

---

### Q55: How are custom AngularJS components configured and integrated into layout views?
To design, implement, and mount custom components (such as a card component) in an AngularJS SPA:

1. **Declare the Component (JavaScript Component File)**:
   Use `angular.module("yourModule").component("componentName", { ... })`. Specify bindings using symbols like `<` (one-way data binding) and link the relative HTML template:
   ```javascript
   // Frontend/components/PatientAppCard.js
   angular.module("hospitalApp").component("patientAppCard", {
       bindings: {
           appointment: "<" // One-way data binding
       },
       templateUrl: "components/PatientAppCard.html", // Relative path from web server root
       controller: function () {
           // Component logic goes here
       }
   });
   ```

2. **Component template syntax (`$ctrl`)**:
   By default, AngularJS components compile templates using the `controllerAs` pattern set to `$ctrl`. Inside the HTML template, bound properties are accessed via `$ctrl`:
   ```html
   <!-- Frontend/components/PatientAppCard.html -->
   <div class="app-item">
       <span class="app-doctor">{{ $ctrl.appointment.doctorName }}</span>
       <span class="status-badge status-{{ $ctrl.appointment.appointment_status }}">
           {{ $ctrl.appointment.appointment_status }}
       </span>
   </div>
   ```

3. **Import in main index**:
   Include the script tag inside [index.html](file:///Users/alvin/Documents/HospitalApp/Frontend/index.html) after the module definition script (`app.js`):
   ```html
   <script src="components/PatientAppCard.js"></script>
   ```

4. **Mount using kebab-case markup**:
   AngularJS translates camelCase component names (`patientAppCard`) into kebab-case tags (`<patient-app-card>`) in HTML layouts:
   ```html
   <patient-app-card ng-repeat="app in upcomingAppointments" appointment="app"></patient-app-card>
   ```

---

### Q56: Why is the `appointmentPairs` array no longer needed in the controller and views?
The `appointmentPairs` array was originally introduced to support a side-by-side table layout where upcoming and previous appointments were matched by their array indices and rendered row-by-row in a table. 

With the shift to a modern CSS grid layout (`.dashboard-columns`), the upcoming and previous lists of appointments are rendered as separate columns:
1. **Direct Array Iteration**: In [home.html](file:///Users/alvin/Documents/HospitalApp/Frontend/views/home.html), the columns use `ng-repeat` to iterate directly and independently over `$scope.upcomingAppointments` and `$scope.previousAppointments`.
2. **Simplified Controller Logic**: In [homeController.js](file:///Users/alvin/Documents/HospitalApp/Frontend/controller/homeController.js), we no longer need to zip the two lists together into a helper array.
3. **No Obsolete References**: Since the table layout is removed, `appointmentPairs` has been completely deleted from the codebase, avoiding unnecessary data restructuring and improving template readability.

---

### Q57: How to make an API endpoint to retrieve appointments based on patient ID?
There are three standard patterns to implement filtering by patient ID within Django REST Framework (DRF):

#### Approach 1: Query Parameter Filter on the ViewSet (Recommended & Most Flexible)
Modify the `get_queryset` method of the existing `AppointmentViewSet` in [views.py](file:///Users/alvin/Documents/HospitalApp/Backend/api/views.py) to look for a `patient` parameter in the request query string.

```python
# Backend/api/views.py
class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        queryset = Appointment.objects.all()
        patient_id = self.request.query_params.get('patient')
        if patient_id is not None:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset
```

* **Client Request**: `GET http://localhost:8000/api/appointments/?patient=3`
* **Pros**: Simple, highly standard, does not require changes to `urls.py`, and allows combining with other filters (e.g., filtering by doctor or date).

#### Approach 2: Custom ViewSet `@action` Route
Add a custom detail or list route to `AppointmentViewSet` using the `@action` decorator.

```python
# Backend/api/views.py
from rest_framework.decorators import action
from rest_framework.response import Response

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer

    @action(detail=False, methods=['get'], url_path='patient/(?P<patient_id>[^/.]+)')
    def by_patient(self, request, patient_id=None):
        appointments = Appointment.objects.filter(patient_id=patient_id)
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)
```

* **Client Request**: `GET http://localhost:8000/api/appointments/patient/3/`
* **Pros**: Provides a explicit URL endpoint dedicated to this operation without relying on URL query strings.

#### Approach 3: Nested API Endpoint View
Create a dedicated read-only sub-resource endpoint (e.g., `api/patients/<patient_id>/appointments/`) by defining a custom `APIView` or secondary ViewSet, and register it in `urls.py`.

```python
# Backend/api/views.py
from rest_framework.views import APIView
from rest_framework import status

class PatientAppointmentsListView(APIView):
    def get(self, request, patient_id):
        appointments = Appointment.objects.filter(patient_id=patient_id)
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
```

```python
# Backend/api/urls.py
path('patients/<int:patient_id>/appointments/', PatientAppointmentsListView.as_view(), name='patient-appointments-list')
```

* **Client Request**: `GET http://localhost:8000/api/patients/3/appointments/`
* **Pros**: Best fit if design specifications call for strict nested sub-resource routing.

---

### Q58: Is overriding `get_queryset` with commented-out class-level `queryset` correct in Django REST Framework?
Yes, the implementation is correct and functional because:
1. **Dynamic Queryset Generation**: Implementing `get_queryset(self)` overrides any class-level `queryset` property. When DRF handles incoming requests, it calls `get_queryset()` to retrieve the list of objects dynamically.
2. **Explicit ForeignKey Filtering**: Using `.filter(patient_id=patient_id)` and `.filter(doctor_id=doctor_id)` matches the default database column names generated by Django's `ForeignKey` relationships, which performs the query efficiently without loading the related objects first.

#### Best Practice Recommendation
While commenting out `# queryset = Appointment.objects.all()` works, it is recommended to keep `queryset = Appointment.objects.all()` uncommented:
- **Router Basename Detection**: When registering the ViewSet in `urls.py` (e.g. `router.register('appointments', AppointmentViewSet)`), DRF uses the `queryset` attribute to automatically infer the router basename. If `queryset` is omitted/commented out and no `basename` is provided in the router registration, Django will raise an error on startup.
- **Auto-generated Documentation**: Schema generators (like Swagger/OpenAPI) and the DRF browsable API use the default class-level `queryset` to determine the model metadata, field lists, and filters.

---

### Q59: Should we build separate login pages for staff (doctors/nurses) and patients, or a single unified login page?
For most healthcare and portal applications, a **Single Unified Login Page** is recommended, backed by **role-based routing** on the frontend. 

Here is a comparison of the design patterns:

#### Option 1: Single Unified Login Page (Recommended)
All users navigate to `/login` to sign in. Once authenticated, the client checks the role in the user profile payload (which is already returned by the backend `LoginView` API) and redirects accordingly.
* **Redirection Flow**:
  - `role === 'patient'` $\rightarrow$ redirect to `/home` (Patient Portal)
  - `role === 'doctor'` $\rightarrow$ redirect to `/doctor-dashboard`
  - `role === 'nurse'` $\rightarrow$ redirect to `/nurse-dashboard`
* **Pros**:
  - Single URL to remember.
  - Less code duplication; reuse views, input validators, stylesheets, and interceptors.
  - Simplified security patch coverage and centralized sessions.
* **Cons**:
  - Requires branding to be generic (e.g. "Hospital Portal Login" instead of "Patient Portal Login").

#### Option 2: Separate Login Pages (e.g. `/login` vs `/staff/login`)
Patients log in at `/login`, while doctors, nurses, and admins log in at `/staff/login`.
* **Pros**:
  - **Security Partitioning**: Allows restricting staff logins to a hospital intranet IP range, active VPN, or requiring strict Multi-Factor Authentication (MFA/SSO like Okta/Active Directory) that is not enforced for patients.
  - **Custom Content**: The patient page can feature registration links, support widgets, and appointment scheduling help, while the staff page is kept strictly functional.
* **Cons**:
  - High code duplication across views and controllers.
  - Staff must remember a separate web path.

#### Recommendation
**Start with a Single Unified Login Page.** It is faster to maintain, cleaner, and matches the existing codebase architecture since the backend `LoginView` already includes the user's role in its JSON response. Only split them if you have distinct security/SSO requirements for employees vs public clients.

---

### Q60: How do we handle a doctor or nurse who is also a patient at the hospital?
There are two common architectural patterns to handle multi-role users (e.g., a doctor who needs to book appointments as a patient):

#### Pattern 1: Separate Accounts (Industry Best Practice / Highly Recommended)
Require the doctor to maintain two distinct user records in the system:
1. **Professional Account**: e.g., `dr.jane@hospital.com` (Role: `doctor`), linked to `DoctorProfile`. Used for managing clinical shifts, diagnoses, and patient appointments.
2. **Personal Account**: e.g., `jane.personal@gmail.com` (Role: `patient`), linked to `PatientProfile`. Used for personal healthcare tracking and bookings.

* **Why this is the industry standard**:
  - **Compliance & Auditing (e.g. HIPAA)**: Medical applications require strict separation between employee clinical capabilities and personal health history. Doctors should not be viewing their own charts or booking appointments using clinical/admin credentials to prevent auditing errors.
  - **Security isolation**: If their public patient password is compromised, their clinical credentials remain safe.
  - **Simplified Database Logic**: Keeps all querysets clean (e.g., a Patient ID maps to a unique single human patient profile, and clinical records are completely separate).

#### Pattern 2: Single Account with Profile Switching
Allow a single user account to have multiple active profile models associated with it:
1. **Data Model Relationship**:
   - In [models.py](file:///Users/alvin/Documents/HospitalApp/Backend/api/models.py), because `DoctorProfile` and `PatientProfile` are `OneToOneField` relations to `CustomUser`, a single user instance can technically possess both relations simultaneously.
2. **UI Implementation**:
   - When a multi-role user logs in, the backend sends a list of roles (e.g., `roles: ["doctor", "patient"]`).
   - The UI includes a role switcher (e.g., in the navbar) that toggles the client-side state between "Doctor View" and "Patient View".
3. **Pros**: The user only needs a single login email and password.
4. **Cons**: Significantly complicates backend authorization logic, as checking `request.user` permissions requires dynamically verifying the active context role of the request.

---

### Q61: Why does navigating to `/doctorHome` throw the user back to the home page (`/`)?
There are three main issues causing this behavior:

1. **Incorrect Controller Dependency Injection (`$state` vs `$location`)**:
   In [doctorHomeController.js](file:///Users/alvin/Documents/HospitalApp/Frontend/controller/doctorHomeController.js), the controller was declared with the `$state` parameter:
   ```javascript
   angular.module("hospitalApp").controller("doctorHomeController", ["$scope", "httpService", "$state", function ($scope, httpService, $state) {
   ```
   Since the application is configured using `ngRoute` (not `ui-router`), `$state` is not a registered provider. This throws an `Unknown provider: $stateProvider` exception on controller instantiation. When AngularJS fails to load the controller, it aborts the route transition and falls back to the default route `/` configured in [app.js](file:///Users/alvin/Documents/HospitalApp/Frontend/app.js):
   ```javascript
   .otherwise({
       redirectTo: "/"
   })
   ```

2. **Hardcoded Redirection in LoginController**:
   In [loginController.js](file:///Users/alvin/Documents/HospitalApp/Frontend/controller/loginController.js), a successful login always triggers:
   ```javascript
   $location.path("/");
   ```
   This redirects all users, including Doctors and Nurses, to the root route (`/`) which renders the patient dashboard.

3. **Hash Routing Requirement**:
   Because HTML5 routing mode is not enabled, the routing is hash-based. Direct URL navigation must be formatted as:
   `http://localhost:3000/#!/doctorHome`
   If you enter `http://localhost:3000/doctorHome` without the hash `#!`, the web server fails to find a physical file/directory, and either fails or returns `index.html` at the root `/`, causing the router to boot into the default `/` page.

---

### Q62: Is `JSON.parse($scope.currentDoctor)` necessary when retrieving the user from localStorage?
Yes, this parsing is necessary, and there is a critical database ID distinction you must be aware of when using this value:

1. **Why `JSON.parse` is necessary**:
   Data stored in `localStorage` is serialized as a string. If you don't parse it, `$scope.currentDoctor` remains a plain string, and trying to access `$scope.currentDoctor.id` or `$scope.currentDoctor.role` will return `undefined`.

   You can write this cleanly in a single line to handle empty states safely:
   ```javascript
   $scope.currentDoctor = JSON.parse(localStorage.getItem('user') || '{}');
   ```

2. **The User ID vs. Doctor Profile ID Warning**:
   The object stored in `localStorage.getItem('user')` represents the **`CustomUser`** table record. 
   * `$scope.currentDoctor.id` refers to the **`User` ID** (e.g. `3`).
   * The backend's `Appointment` model filters appointments by **`DoctorProfile` ID**, which is a separate table and has its own primary key `id` (e.g. `1`).

   If you directly pass the User ID (`$scope.currentDoctor.id`) to `getAppointmentsByDoctorId()`, it will look for a `DoctorProfile` with that ID, which might belong to a different doctor or not exist at all.

   **Solution**: First retrieve the doctor profiles, find the profile belonging to the logged-in user, and then query the appointments:
   ```javascript
   httpService.getDoctors().then(function (response) {
       const doctors = response.data;
       const currentProfile = doctors.find(doc => doc.user && doc.user.id === $scope.currentDoctor.id);
       
       if (currentProfile) {
           return httpService.getAppointmentsByDoctorId(currentProfile.id);
       }
   }).then(function (appResponse) {
       // Handle appointment data here
   });
   ```

---

### Q63: How can we limit appointment queries in Django so doctors and patients only see their own records?
To implement robust role-based access control (RBAC) in Django REST Framework, you should dynamically filter the query results within the ViewSet's `get_queryset()` method based on `self.request.user`.

#### Proposed implementation:
Update `get_queryset()` in [views.py](file:///Users/alvin/Documents/HospitalApp/Backend/api/views.py) as follows:

```python
class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        
        # 1. Reject unauthenticated requests
        if not user or not user.is_authenticated:
            return Appointment.objects.none()
            
        queryset = Appointment.objects.all()

        # 2. Limit records based on user role
        if user.role == 'patient':
            # Filter appointments where patient profile belongs to request.user
            queryset = queryset.filter(patient__user=user)
        elif user.role == 'doctor':
            # Filter appointments where doctor profile belongs to request.user
            queryset = queryset.filter(doctor__user=user)
        # admins and nurses can view all appointments by default

        # 3. Apply optional URL query parameters (if provided)
        patient_id = self.request.query_params.get('patient')
        doctor_id = self.request.query_params.get('doctor')
        
        if patient_id is not None:
            queryset = queryset.filter(patient_id=patient_id)
        if doctor_id is not None:
            queryset = queryset.filter(doctor_id=doctor_id)

        return queryset
```

#### Why this approach is highly secure:
2. **Standard ORM Joins**: The double underscore notation (`patient__user=user`) traverses foreign key relationships to match the logged-in User profile seamlessly.

---

### Q64: How does `self` have access to the `request` object in Django REST Framework's ViewSet methods?
In Python and Django, ViewSets (`ModelViewSet`) inherit from Class-Based Views (specifically `APIView` and `GenericAPIView`). The request binding happens automatically during the routing lifecycle:

1. **Instantiation**:
   When a URL matches a route, Django calls the viewset's `.as_view()` method. This method creates an instance of the ViewSet class (which becomes `self`).

2. **Dispatch Phase**:
   Django routes the HTTP request to the view's `.dispatch(request, *args, **kwargs)` method.

3. **Request Wrapping & Binding**:
   Inside Django REST Framework's `dispatch()` method:
   - DRF wraps Django's standard `HttpRequest` in a custom DRF `Request` object (which handles query parameters via `.query_params` and JSON bodies via `.data`).
   - DRF binds this wrapped request object to the viewset instance as an attribute:
     ```python
     self.request = request
     ```
   - Because `self.request` is set on the instance, **any method inside the class** (such as `get_queryset(self)`, `get_serializer_class(self)`, or custom actions) can access it using `self.request`.

4. **Authentication Middleware**:
   The `self.request.user` attribute is populated dynamically during the dispatch lifecycle by Django's and DRF's authentication classes (like TokenAuthentication). If the authentication is successful, `self.request.user` contains the authenticated user object; if not, it contains an `AnonymousUser` instance.

---

### Q65: Is there a `patient__user` column in the database when filtering `patient__user=user`?
**No**, there is no `patient__user` column in the database. 

Instead, Django ORM uses the double underscore (`__`) syntax to traverse model relationships by performing SQL `JOIN` operations:

#### Database Schema Layout:
1. **`api_appointment` table**:
   Contains a `patient_id` foreign key column referencing the primary key of the `api_patientprofile` table.
2. **`api_patientprofile` table**:
   Contains a `user_id` foreign key column referencing the primary key of the custom user table (`auth_user` or similar).

#### How the ORM translates `patient__user=user`:
When you execute `queryset.filter(patient__user=user)`, Django translates it into a join:
1. Join `api_appointment` with `api_patientprofile` where `api_appointment.patient_id = api_patientprofile.id`.
2. Filter the result where `api_patientprofile.user_id = user.id`.

The actual generated raw SQL query looks like this:
```sql
SELECT * 
FROM api_appointment
INNER JOIN api_patientprofile ON (api_appointment.patient_id = api_patientprofile.id)
WHERE api_patientprofile.user_id = <user_id>;
```

This abstraction allows you to write database queries cleanly in Python without writing manual JOIN SQL code.

---

### Q66: Why does `queryset.filter(doctor_id=user.id)` return no appointments?
This returns an empty queryset due to a mismatch between **User ID** and **DoctorProfile ID**:

1. **The Core Issue**:
   * `user.id` is the primary key of the **`CustomUser`** model (e.g., `3`).
   * `doctor_id` is the foreign key to the **`DoctorProfile`** model (e.g., `1`).
   * By calling `queryset.filter(doctor_id=user.id)`, you query appointments where `doctor_id = 3`. However, the logged-in doctor's profile ID is `1` (even though their user ID is `3`), resulting in empty results.

2. **The Correct Query (Relational Joins)**:
   To filter by the user object directly, use double-underscore relationship traversal:
   ```python
   # Correct approach for doctors
   queryset = queryset.filter(doctor__user=user)

   # Correct approach for patients
   queryset = queryset.filter(patient__user=user)
   ```

3. **Asynchronous JavaScript Warning**:
   In [doctorHomeController.js](file:///Users/alvin/Documents/HospitalApp/Frontend/controller/doctorHomeController.js), the profile fetch is asynchronous, but the appointments request is called immediately outside the promise callback:
   ```javascript
   // ❌ BUG: doctorProfile is empty when getAppointmentsByDoctorId is called
   httpService.getDoctors().then(function (response) {
       $scope.doctorProfile = response.data[0];
   });

   httpService.getAppointmentsByDoctorId($scope.doctorProfile.id) // $scope.doctorProfile.id is undefined!
   ```
   **Solution**: Since the backend automatically filters querysets by `request.user` on `/api/appointments/`, the frontend doesn't need to specify `doctorProfile.id` at all. Simply call `getAppointments()` (without parameters) and the backend will securely isolate and return only that logged-in doctor's appointments.

---

### Q67: Why does Django use `doctor__user=user` instead of `doctor.user=user` when filtering querysets?
This is due to **Python syntax limitations** and **Django ORM design choices**:

1. **Python Syntax Restrictions**:
   When you filter queries in Django, you call a method and pass keyword arguments, e.g. `filter(name=value)`.
   In Python, parameter names in keyword arguments are treated as identifiers. Having a dot (`.`) inside a parameter name is **syntactically invalid Python**:
   ```python
   # ❌ SyntaxError: expression cannot contain assignment, perhaps you meant "=="?
   queryset.filter(doctor.user=user)
   ```
   To bypass this constraint and represent traversals through multiple tables, Django's designers chose the double underscore (`__`) as their relationship path separator.

2. **Differentiating Queries from memory access**:
   * **In Queries (ORM/Database level)**: Use `__` to specify relationships to be joined in SQL:
     ```python
     # Translates into SQL JOINs
     Appointment.objects.filter(doctor__user=user)
     ```
   * **In Memory (Python object level)**: Use the dot (`.`) to access attributes on objects that have already been fetched and instantiated in memory:
     ```python
     # Evaluated in Python memory
     if appointment.doctor.user == user:
         print("This is the doctor's user account")
     ```

---

### Q68: Why does the doctor dashboard crash with `TypeError: Cannot read properties of undefined (reading 'first_name')`?
This error is caused by a variable lookup bug inside [doctorHomeController.js](file:///Users/alvin/Documents/HospitalApp/Frontend/controller/doctorHomeController.js):

1. **The Bug**:
   ```javascript
   patientApps.forEach(app => {
       const doctor = response.data.find(doc => doc.id === app.doctor);
       app.doctorName = doctor ? `${doctor.user.first_name} ${doctor.user.last_name}` : 'Unknown Doctor';
   });
   ```
   * Here, `response.data` is the list of **Appointments**, not the list of **Doctors**.
   * When calling `response.data.find(...)`, the code searches for an `Appointment` object whose ID matches the doctor's ID.
   * If an `Appointment` object is found, it is assigned to the variable `doctor`. However, `Appointment` models in the database do not have a `user` property (unlike `DoctorProfile`), so `doctor.user` resolves to `undefined`.
   * Trying to read `doctor.user.first_name` throws the `Cannot read properties of undefined (reading 'first_name')` error.

2. **The Logic Bug with Dates**:
   The controller parses dates using:
   ```javascript
   const appTime = new Date(app.appointment_datetime);
   ```
   Since the backend model field is named `appointment_date` (not `appointment_datetime`), this evaluates to `new Date(undefined)` which creates an invalid date object and breaks sorting and display format calculations.

3. **Dashboard Context Mapping (Patient Names)**:
   On a doctor's dashboard, the doctor already knows their own name. Instead, the UI needs to display the **Patient's name** for each appointment.
   To do this, the controller should:
   - Load patient profiles using `httpService.getPatients()`.
   - Build a patient lookup map: `$scope.patientsMap[patient.id] = name`.
   - Map `app.patientName = $scope.patientsMap[app.patient]`.

---

### Q69: How is the custom `doctorAppCard` component configured to show patient information?
To display detailed patient profiles on the doctor dashboard, we implement the following:

1. **JavaScript Component Declaration**:
   Register `doctorAppCard` inside `DoctorAppCard.js`. Ensure that the `templateUrl` is correctly relative to the project root:
   ```javascript
   angular.module("hospitalApp").component("doctorAppCard", {
       bindings: {
           appointment: "<" // One-way binding
       },
       templateUrl: "components/DoctorAppCard.html"
   });
   ```

2. **Controller Pre-mapping**:
   Modify [doctorHomeController.js](file:///Users/alvin/Documents/HospitalApp/Frontend/controller/doctorHomeController.js) to resolve the patient profile details (name, email, phone, location) asynchronously, binding them to `$ctrl.appointment.patientDetails` for immediate access inside the card.

3. **Card Component Layout**:
   Design [DoctorAppCard.html](file:///Users/alvin/Documents/HospitalApp/Frontend/components/DoctorAppCard.html) to render metadata blocks:
- **Diagnosis/Clinical Block**: Showing previous clinical diagnoses if present.

---

### Q70: How are route parameters, nested fetches, and role-based controls integrated on the Appointment Details page?
Designing a detailed view with contextual action permissions (e.g. patients viewing info vs doctors updating diagnosis/status) requires three architectural practices:

1. **Extracting Route Parameters (`$routeParams`)**:
   By registering the path with a route parameter placeholder (e.g. `path("/appointmentDetails/:appointmentId")` in `app.js`), AngularJS parses URL variables and binds them to the `$routeParams` service in the matching controller:
   ```javascript
   $scope.appointmentId = $routeParams.appointmentId;
   ```

2. **Chaining Nested Asynchronous Calls**:
   Because the main `Appointment` query only yields database primary keys (IDs) for patient and doctor, the controller must run secondary queries sequentially to build detailed profile payloads:
   ```javascript
   // Fetch main appointment
   httpService.getAppointment($scope.appointmentId).then(function(response) {
       $scope.appointment = response.data;
       // Fetch linked patient profile
       return httpService.getPatient(response.data.patient);
   }).then(function(patientResponse) {
       $scope.appointment.patientDetails = patientResponse.data;
       // Fetch linked doctor profile
       return httpService.getDoctor($scope.appointment.doctor);
   }).then(function(doctorResponse) {
       $scope.appointment.doctorDetails = doctorResponse.data;
   });
   ```

3. **Role-Based Dynamic Interfaces (`ng-if`)**:
   To prevent patients from editing clinical notes or completing their own sessions, wrap control features in permission boundaries matching the session user's role payload:
   * **Doctor Portal Controls (`ng-if="currentUser.role === 'doctor'"`)**: Renders textarea forms bound to `$parent.diagnosisInput` (to respect child scope variables inside templates) along with completion/cancellation buttons.
   * **Patient Portal Controls (`ng-if="currentUser.role === 'patient'"`)**: Renders cancellation/rescheduling action warnings without administrative/clinical forms.

---

### Q71: How should we supply the data payload to `httpService.putAppointments()` when updating appointment status or details?
When sending data updates (like changing the appointment status to `"Cancelled"` or `"Completed"`) to a Django REST Framework ViewSet, there are two primary methods:

#### Method A: Map a Clean PUT Payload (Recommended for `PUT` requests)
Since `$scope.appointment` contains extra properties added in the controller (such as `patientDetails` and `doctorDetails`), passing `$scope.appointment` directly sends a bloated payload. While DRF ignores unknown fields, passing a clean object containing only the fields defined in the database serializer is best practice:

```javascript
const payload = {
    patient: $scope.appointment.patient,            // Patient profile ID
    doctor: $scope.appointment.doctor,              // Doctor profile ID
    appointment_date: $scope.appointment.appointment_date,
    appointment_status: $scope.appointment.appointment_status,
    diagnosis: $scope.appointment.diagnosis || "",
    total_bills: $scope.appointment.total_bills || 0.00,
    paid: $scope.appointment.paid || false
};

httpService.putAppointments($scope.appointmentId, payload);
```

#### Method B: Use a partial update (PATCH)
If you only need to modify one or two fields (such as `appointment_status`), you can use a `PATCH` request. This avoids validating all other fields (like date/time formats) on the server.
1. Add `patchAppointment` to `httpService.js`:
   ```javascript
   patchAppointment(id, data) {
       return $http.patch(`${BASE_URL}/appointments/${id}/`, data);
   }
   ```
2. Call it in your controller:
   ```javascript
   httpService.patchAppointment($scope.appointmentId, { 
       appointment_status: "Cancelled" 
   });
   ```

---

### Q72: Why don't we need to specify `?appointmentId=${id}` when retrieving a single appointment via `/api/appointments/${id}/`?
This is the core difference between **REST Path Parameters** (Detail view) and **URL Query Parameters** (List/Filter view):

1. **REST Detail Route (Path Parameter)**:
   The URL `/api/appointments/${id}/` tells the server: *"Give me the specific single resource residing at index `${id}`"*.
   * Django REST Framework views (`ModelViewSet`) automatically maps URLs containing `/appointments/<pk>/` to the `retrieve()` action.
   * DRF extracts the ID directly from the URL path as a primary key variable, queries the database, and returns a single **JSON Object** `{ ... }`.

2. **REST List/Query Route (Query Parameter)**:
   The URL `/api/appointments/?id=${id}` tells the server: *"Give me the general list collection of all appointments, but filter the collection where ID is `${id}`"*.
   * Django maps this to the `list()` action.
   * Unless you configure the backend views to look for `?id=...` parameters, Django ignores it and returns a **JSON Array** `[ ... ]` containing all appointments.

3. **Comparison Summary**:
   | Request Style | API Action | Response Type | Example Payload |
   | :--- | :--- | :--- | :--- |
   | `/api/appointments/5/` | `retrieve()` | Object | `{ "id": 5, "patient": 2 ... }` |
   | `/api/appointments/?patient=2` | `list()` | Array | `[ { "id": 5, ... }, { "id": 6, ... } ]` |

---

### Q73: If we want the backend to filter list endpoints by a query parameter, how is the request sent and how should the views be coded?
If you choose to fetch resources by a query parameter instead of using path parameters (e.g. fetching by `?appointmentId=5` instead of `/5/`), you must match the parameter keys on both sides and parse the collection array in your frontend.

#### 1. Frontend: How to send the Request
Form the URL using `?key=value`. The key must exactly match the key parsed in Django:
* **Service Method (`httpService.js`)**:
  ```javascript
  getAppointmentById(appointmentId) {
      // 🚀 The query key is "appointmentId" to match the backend python view
      return $http.get(`${BASE_URL}/appointments/?appointmentId=${appointmentId}`);
  }
  ```
* **Controller handler (`appointmentDetails.js`)**:
  Because list endpoints always wrap returned records in a JSON list (array), the controller must extract the first index:
  ```javascript
  httpService.getAppointmentById($scope.appointmentId).then(function (response) {
      // 🚀 Extract the first item from the array [ { ... } ]
      $scope.appointment = response.data[0]; 
  });
  ```

#### 2. Backend: How the Viewset is coded (`views.py`)
In `get_queryset(self)`, retrieve the parameter using `self.request.query_params.get('key')` and apply the filter:
```python
class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Appointment.objects.all()

        # Enforce security boundaries
        if user.role == 'patient':
            queryset = queryset.filter(patient__user=user)
        elif user.role == 'doctor':
            queryset = queryset.filter(doctor__user=user)

        # 🚀 Parse and apply the query parameter filter
        appointment_id = self.request.query_params.get('appointmentId')
        if appointment_id is not None:
            queryset = queryset.filter(id=appointment_id)

        return queryset
```

---

### Q74: How are multiple query parameters structured in HTTP requests and parsed on the backend?
To construct and extract multiple query parameters (e.g. filtering appointments by both doctor ID and status), use the following patterns:

#### 1. Frontend: How to send the Request (Constructing URL with `&`)
Query parameters are joined together using the ampersand (`&`) symbol:
`URL?param1=value1&param2=value2`

* **Option A: Manual string interpolation**:
  ```javascript
  getAppointmentsFiltered(doctorId, status) {
      return $http.get(`${BASE_URL}/appointments/?doctor=${doctorId}&status=${status}`);
  }
  ```

* **Option B: Using `$http` `params` config object (Recommended)**:
  AngularJS allows passing a `params` object, which handles URL serialization, character encoding, and automatically strips out `undefined` fields:
  ```javascript
  getAppointmentsFiltered(doctorId, status) {
      return $http.get(`${BASE_URL}/appointments/`, {
          params: {
              doctor: doctorId,
              status: status
          }
      });
  }
  ```

#### 2. Backend: How the View is coded (`views.py`)
In `get_queryset(self)`, retrieve each query parameter individually and chain the Django ORM filters. Because Django querysets are lazily evaluated, chaining multiple filters compiles down to a single SQL query:

```python
    def get_queryset(self):
        user = self.request.user
        queryset = Appointment.objects.all()

        # 1. Retrieve all parameters
        doctor_id = self.request.query_params.get('doctor')
        status = self.request.query_params.get('status')

        # 2. Dynamically apply filters if they are provided
        if doctor_id is not None:
            queryset = queryset.filter(doctor_id=doctor_id)
        if status is not None:
            queryset = queryset.filter(appointment_status=status)

        return queryset
```

---

### Q75: How do we implement role-based route access controls (route guards) in AngularJS?
To restrict access to routes like `/doctorHome` (so patients cannot access them) and `/` (so doctors are redirected to the staff view), configure the routing middleware inside the `app.run` block:

1. **Configure `$routeChangeStart`**:
   Listen to the `$routeChangeStart` event which triggers before any client-side route transition resolves.
2. **Implement Role Validation**:
   Inspect the `next` route template path and cross-reference it with the user's role metadata stored in `localStorage`:

```javascript
app.run(["$rootScope", "$location", function ($rootScope, $location) {
    $rootScope.$on("$routeChangeStart", function (event, next, current) {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const isPublicRoute = next && (next.templateUrl === "views/login.html" || next.templateUrl === "views/register.html");

        // 1. Unauthenticated redirect
        if (!token && !isPublicRoute) {
            $location.path("/login");
            return;
        }

        // 2. Role-Based access checks
        if (token && next) {
            // Patient attempting to access Doctor Dashboard
            if (next.templateUrl === "views/doctorHome.html" && user.role !== "doctor") {
                $location.path("/"); // Redirect to patient home dashboard
            }
            // Doctor attempting to access Patient Dashboard
            if (next.templateUrl === "views/home.html" && user.role === "doctor") {
                $location.path("/doctorHome"); // Redirect to doctor dashboard
            }
        }
    });
}]);
```
