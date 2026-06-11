import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import CustomUser, DoctorProfile

doctors_data = [
    {
        'email': 'elizabeth.blackwell@hospital.com',
        'first_name': 'Elizabeth',
        'last_name': 'Blackwell',
        'specialization': 'Cardiology',
        'experience': '12 years',
        'bio': 'Specializes in cardiovascular health and preventative care.'
    },
    {
        'email': 'benjamin.spock@hospital.com',
        'first_name': 'Benjamin',
        'last_name': 'Spock',
        'specialization': 'Pediatrics',
        'experience': '15 years',
        'bio': 'Dedicated pediatrician focused on adolescent health and child development.'
    },
    {
        'email': 'sigmund.freud@hospital.com',
        'first_name': 'Sigmund',
        'last_name': 'Freud',
        'specialization': 'Psychiatry',
        'experience': '20 years',
        'bio': 'Expert in clinical psychiatry and cognitive behavioral therapy.'
    },
    {
        'email': 'virginia.apgar@hospital.com',
        'first_name': 'Virginia',
        'last_name': 'Apgar',
        'specialization': 'Anesthesiology',
        'experience': '8 years',
        'bio': 'Experienced anesthesiologist and intensive care specialist.'
    },
    {
        'email': 'jonas.salk@hospital.com',
        'first_name': 'Jonas',
        'last_name': 'Salk',
        'specialization': 'Immunology',
        'experience': '18 years',
        'bio': 'Focused on infectious disease prevention and immunology research.'
    }
]

for data in doctors_data:
    user, created = CustomUser.objects.get_or_create(
        email=data['email'],
        defaults={
            'username': data['email'],
            'first_name': data['first_name'],
            'last_name': data['last_name'],
            'role': 'doctor',
            'is_active': True
        }
    )
    if created:
        user.set_password('DoctorPass123!')
        user.save()
        print(f"Created user for Dr. {data['first_name']} {data['last_name']}")
    else:
        user.first_name = data['first_name']
        user.last_name = data['last_name']
        user.role = 'doctor'
        user.save()
        print(f"User for Dr. {data['first_name']} {data['last_name']} already exists")

    profile, p_created = DoctorProfile.objects.get_or_create(
        user=user,
        defaults={
            'specialization': data['specialization'],
            'experience': data['experience'],
            'bio': data['bio']
        }
    )
    if not p_created:
        profile.specialization = data['specialization']
        profile.experience = data['experience']
        profile.bio = data['bio']
        profile.save()
        print(f"Updated profile for Dr. {data['first_name']} {data['last_name']}")
    else:
        print(f"Created profile for Dr. {data['first_name']} {data['last_name']}")

print("Mock doctors population complete.")
