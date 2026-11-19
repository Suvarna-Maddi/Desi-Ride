from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class DesiRideUserManager(BaseUserManager):
    def create_user(self, email, mobile, full_name, password=None, role='customer', **extra_fields):
        if not email:
            raise ValueError('Email address is required')
        if not mobile:
            raise ValueError('Mobile number is required')
        if role == 'admin' and not extra_fields.get('is_superuser'):
            raise ValueError('Admin accounts cannot be publicly self-registered')

        email = self.normalize_email(email)
        user = self.model(
            email=email,
            mobile=mobile,
            full_name=full_name,
            role=role,
            **extra_fields
        )
        user.set_password(password)  # Django PBKDF2-SHA256 secure password hashing
        user.save(using=self._db)
        return user

    def create_superuser(self, email, mobile, full_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(
            email=email,
            mobile=mobile,
            full_name=full_name,
            password=password,
            role='admin',
            **extra_fields
        )


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('owner', 'Vehicle Owner'),
        ('operator', 'Operator / Driver'),
        ('admin', 'Admin'),
    )
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('pending', 'Pending Verification'),
        ('suspended', 'Suspended'),
    )

    email = models.EmailField(unique=True, db_index=True)
    mobile = models.CharField(max_length=15, unique=True, db_index=True)
    full_name = models.CharField(max_length=150)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    account_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    is_email_verified = models.BooleanField(default=False)
    is_mobile_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = DesiRideUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['mobile', 'full_name']

    class Meta:
        db_table = 'desiride_users'


# Alias for backward compatibility with settings.AUTH_USER_MODEL = 'accounts.DesiRideUser'
DesiRideUser = User


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    accepted_terms = models.BooleanField(default=True)
    accepted_privacy = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'desiride_user_profiles'


class Address(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='address_record')
    address_line = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'desiride_addresses'


class CustomerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    preferred_hub = models.CharField(max_length=100, default='Gadwal, Telangana')
    total_bookings = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'desiride_customer_profiles'


class OwnerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='owner_profile')
    business_name = models.CharField(max_length=180, blank=True, null=True)
    fleet_size = models.PositiveIntegerField(default=0)
    is_verified_fleet = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'desiride_owner_profiles'


class OperatorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='operator_profile')
    licence_number = models.CharField(max_length=60, unique=True)
    licence_expiry = models.DateField()
    is_licence_verified = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'desiride_operator_profiles'


class OTPVerification(models.Model):
    mobile = models.CharField(max_length=15, db_index=True)
    email = models.EmailField(db_index=True)
    otp_code_hash = models.CharField(max_length=255)
    email_verification_token = models.CharField(max_length=128, unique=True)
    is_mobile_verified = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'desiride_otp_verifications'


class VehicleListing(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vehicles')
    name = models.CharField(max_length=140)
    category = models.CharField(max_length=80)
    registration_number = models.CharField(max_length=40, unique=True)
    rate = models.CharField(max_length=50)
    availability = models.CharField(max_length=40, default='Available')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'desiride_vehicles'


class BookingOrder(models.Model):
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='customer_bookings')
    vehicle_name = models.CharField(max_length=140)
    pickup_location = models.CharField(max_length=180)
    destination = models.CharField(max_length=180)
    scheduled_at = models.CharField(max_length=100)
    price_estimate = models.CharField(max_length=60)
    status = models.CharField(max_length=40, default='Confirmed')
    journey_update = models.CharField(max_length=200, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'desiride_bookings'
