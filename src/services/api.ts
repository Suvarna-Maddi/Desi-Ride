import { AuthResponse, LoginPayload, RegisterPayload, UserProfile, UserRole } from '../types/auth';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

const ACCESS_TOKEN_KEY = 'desiride_access_token';
const REFRESH_TOKEN_KEY = 'desiride_refresh_token';
const PENDING_BOOKING_KEY = 'desiride_pending_booking';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh: string, remember = true) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(ACCESS_TOKEN_KEY, access);
  storage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getDashboardPathForRole(role: UserRole): string {
  switch (role) {
    case 'customer':
      return '/customer/dashboard';
    case 'owner':
      return '/owner/dashboard';
    case 'operator':
      return '/operator/dashboard';
    case 'admin':
      return '/control-desk-x7k9p2m8';
    default:
      return '/customer/dashboard';
  }
}

export function savePendingBooking(intent: any) {
  sessionStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(intent));
}

export function consumePendingBooking(): any | null {
  const raw = sessionStorage.getItem(PENDING_BOOKING_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(PENDING_BOOKING_KEY);
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retryWithRefresh = true
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && retryWithRefresh) {
    const refresh = getRefreshToken();
    if (refresh) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
          credentials: 'include',
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.access) {
            const inLocal = Boolean(localStorage.getItem(REFRESH_TOKEN_KEY));
            setTokens(refreshData.access, refreshData.refresh || refresh, inLocal);
            return apiRequest<T>(endpoint, options, false);
          }
        }
      } catch {
        // Refresh failed; fall through to clear tokens
      }
    }
    clearTokens();
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errMsg =
      data.detail ||
      data.error ||
      data.message ||
      (typeof data === 'object' && Object.values(data).flat()[0]) ||
      `Request failed (${response.status})`;
    throw new Error(String(errMsg));
  }

  return data as T;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiRequest<AuthResponse>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: LoginPayload) =>
    apiRequest<AuthResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () => {
    const refresh = getRefreshToken();
    return apiRequest<{ message: string }>(
      '/auth/logout/',
      {
        method: 'POST',
        body: JSON.stringify({ refresh }),
      },
      false
    ).finally(() => clearTokens());
  },

  getMe: () => apiRequest<UserProfile>('/auth/me/', { method: 'GET' }),

  verifyOtp: (payload: { mobile?: string; email?: string; otp: string }) =>
    apiRequest<{ verified: boolean; message: string }>('/auth/verify-otp/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  forgotPassword: (identifier: string) =>
    apiRequest<{ message: string; reset_token?: string }>('/auth/forgot-password/', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    }),

  resetPassword: (payload: { identifier: string; otp: string; new_password: string }) =>
    apiRequest<{ message: string }>('/auth/reset-password/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getCustomerDashboard: () => apiRequest<any>('/customer/dashboard/', { method: 'GET' }),
  getOwnerDashboard: () => apiRequest<any>('/owner/dashboard/', { method: 'GET' }),
  getOperatorDashboard: () => apiRequest<any>('/operator/dashboard/', { method: 'GET' }),
  getAdminDashboard: () => apiRequest<any>('/admin/dashboard/', { method: 'GET' }),

  getEquipmentCatalog: (query?: string) =>
    apiRequest<any>(`/equipment/${query ? `?${query}` : ''}`, { method: 'GET' }),

  addOwnerEquipment: (equipmentData: any) =>
    apiRequest<any>('/owner/equipment/', {
      method: 'POST',
      body: JSON.stringify(equipmentData),
    }),

  updateOwnerEquipment: (payload: any) =>
    apiRequest<any>('/owner/equipment/', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  adminManageEquipment: (payload: any) =>
    apiRequest<any>('/admin/dashboard/', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  createBooking: (bookingData: any) =>
    apiRequest<any>('/customer/dashboard/', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    }),

  addOwnerVehicle: (vehicleData: any) =>
    apiRequest<any>('/owner/dashboard/', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    }),

  updateBookingStatus: (endpoint: string, payload: any) =>
    apiRequest<any>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  toggleOperatorDuty: (on_duty: boolean) =>
    apiRequest<any>('/operator/dashboard/', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'toggle_duty', on_duty }),
    }),

  updateOperatorLocation: (payload: { lat: number; lng: number; eta_minutes?: number; booking_id?: number }) =>
    apiRequest<any>('/operator/dashboard/', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'update_location', ...payload }),
    }),

  verifyStartOtp: (booking_id: number, otp: string) =>
    apiRequest<any>('/operator/dashboard/', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'verify_start_otp', booking_id, otp }),
    }),

  markNotificationsRead: () =>
    apiRequest<any>('/notifications/mark-read/', {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  getFareEstimate: (payload: {
    base_rate?: number;
    rate_unit?: string;
    quantity?: number;
    need_operator?: boolean;
    has_attached_equipment?: boolean;
    attached_equipment_name?: string;
    city?: string;
  }) =>
    apiRequest<any>('/pricing/estimate/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createPaymentOrder: (payload: { booking_id: number; amount: number; notes?: string }) =>
    apiRequest<any>('/payments/create-order/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyPayment: (payload: {
    order_id: string;
    payment_id?: string;
    signature?: string;
    booking_id: number;
    payment_method?: string;
  }) =>
    apiRequest<any>('/payments/verify/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getBookingTaxInvoice: (bookingId: number) =>
    apiRequest<any>(`/bookings/${bookingId}/invoice`, { method: 'GET' }),

  getBookingRoute: (bookingId: number) =>
    apiRequest<any>(`/bookings/${bookingId}/route`, { method: 'GET' }),

  simulateOperatorStep: (payload: {
    booking_id: number;
    step_index: number;
    lat: number;
    lng: number;
    eta_minutes?: number;
    speed?: number;
    heading?: string;
  }) =>
    apiRequest<any>('/operator/simulate-step/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  triggerEmergencySos: (payload: { booking_id: number; lat?: number; lng?: number }) =>
    apiRequest<any>('/emergency/sos/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

