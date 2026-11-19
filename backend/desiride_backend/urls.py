from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import (
    AdminDashboardAPIView,
    CheckEmailAvailabilityAPIView,
    CheckMobileAvailabilityAPIView,
    CustomerDashboardAPIView,
    ForgotPasswordAPIView,
    LoginAPIView,
    LogoutAPIView,
    MeAPIView,
    OperatorDashboardAPIView,
    OwnerDashboardAPIView,
    RegisterAPIView,
    ResendRegistrationOtpAPIView,
    ResetPasswordAPIView,
    VerifyOtpAPIView,
    VerifyRegistrationEmailAPIView,
    VerifyRegistrationOtpAPIView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    # Authentication & Registration Endpoints
    path('api/auth/register/', RegisterAPIView.as_view(), name='auth-register'),
    path('api/auth/register/check-email/', CheckEmailAvailabilityAPIView.as_view(), name='auth-register-check-email'),
    path('api/auth/register/check-mobile/', CheckMobileAvailabilityAPIView.as_view(), name='auth-register-check-mobile'),
    path('api/auth/register/resend-otp/', ResendRegistrationOtpAPIView.as_view(), name='auth-register-resend-otp'),
    path('api/auth/register/verify-otp/', VerifyRegistrationOtpAPIView.as_view(), name='auth-register-verify-otp'),
    path('api/auth/register/verify-email/', VerifyRegistrationEmailAPIView.as_view(), name='auth-register-verify-email'),
    path('api/auth/login/', LoginAPIView.as_view(), name='auth-login'),
    path('api/auth/logout/', LogoutAPIView.as_view(), name='auth-logout'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('api/auth/me/', MeAPIView.as_view(), name='auth-me'),
    path('api/auth/verify-otp/', VerifyOtpAPIView.as_view(), name='auth-verify-otp'),
    path('api/auth/forgot-password/', ForgotPasswordAPIView.as_view(), name='auth-forgot-password'),
    path('api/auth/reset-password/', ResetPasswordAPIView.as_view(), name='auth-reset-password'),
    # Role-Based Dashboard Endpoints
    path('api/customer/dashboard/', CustomerDashboardAPIView.as_view(), name='customer-dashboard'),
    path('api/owner/dashboard/', OwnerDashboardAPIView.as_view(), name='owner-dashboard'),
    path('api/operator/dashboard/', OperatorDashboardAPIView.as_view(), name='operator-dashboard'),
    path('api/admin/dashboard/', AdminDashboardAPIView.as_view(), name='admin-dashboard'),
]
