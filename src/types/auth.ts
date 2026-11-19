export type UserRole = 'customer' | 'owner' | 'operator' | 'admin';

export interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  mobile: string;
  role: UserRole;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  business_name?: string;
  licence_number?: string;
  licence_expiry?: string;
  is_mobile_verified?: boolean;
  is_email_verified?: boolean;
  created_at?: string;
}

export interface PendingBookingIntent {
  tab?: 'vehicles' | 'services';
  pickup?: string;
  destination?: string;
  vehicleType?: string;
  dateTime?: string;
  vehicleId?: string;
  vehicleName?: string;
  price?: string;
  unit?: string;
}

export interface RegisterPayload {
  role: 'customer' | 'owner' | 'operator';
  full_name: string;
  email: string;
  mobile: string;
  password: string;
  confirm_password: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  business_name?: string;
  licence_number?: string;
  licence_expiry?: string;
  mobile_otp?: string;
  email_otp?: string;
  accepted_terms: boolean;
}

export interface LoginPayload {
  identifier: string; // email or mobile
  password: string;
  remember_me?: boolean;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: UserProfile;
  message?: string;
}

