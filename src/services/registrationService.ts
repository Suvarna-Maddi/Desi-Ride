import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './api';
import { AuthResponse } from '../types/auth';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

async function regFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMsg =
      data.detail ||
      data.error ||
      data.message ||
      (typeof data === 'object' && Object.values(data).flat()[0]) ||
      `Request failed (${res.status})`;
    throw new Error(String(errMsg));
  }

  return data as T;
}

export interface SendOtpResponse {
  sent: boolean;
  message: string;
  mobile_masked: string;
  email_masked: string;
  expires_in_seconds: number;
  sms_dispatch_id?: string;
  email_verification_token?: string;
  provider_status?: string;
}

export interface VerifyOtpResponse {
  verified: boolean;
  mobile_verified: boolean;
  message: string;
  verification_session_token: string;
}

export interface VerifyEmailResponse {
  verified: boolean;
  email_verified: boolean;
  message: string;
}

export const registrationService = {
  checkEmailAvailability: (email: string) =>
    regFetch<{ available: boolean; message?: string }>(
      `/auth/register/check-email/?email=${encodeURIComponent(email.trim().toLowerCase())}`,
      { method: 'GET' }
    ),

  checkMobileAvailability: (mobile: string) =>
    regFetch<{ available: boolean; message?: string }>(
      `/auth/register/check-mobile/?mobile=${encodeURIComponent(mobile.trim().replace(/\D/g, '').slice(-10))}`,
      { method: 'GET' }
    ),

  resendOrSendOtp: (payload: { email: string; mobile: string; full_name?: string }) =>
    regFetch<SendOtpResponse>('/auth/register/resend-otp/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyMobileOtp: (payload: { mobile: string; email: string; otp: string }) =>
    regFetch<VerifyOtpResponse>('/auth/register/verify-otp/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyEmailToken: (payload: { email: string; token: string }) =>
    regFetch<VerifyEmailResponse>('/auth/register/verify-email/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  completeRegistration: (payload: any) =>
    regFetch<AuthResponse>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export { getAccessToken, getRefreshToken, setTokens, clearTokens };
