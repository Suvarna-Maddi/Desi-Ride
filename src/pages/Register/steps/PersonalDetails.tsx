import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { RegistrableRoleType } from '../../../components/registration/RoleSelectionCard';
import { FormInput } from '../../../components/registration/FormInput';
import { PasswordInput } from '../../../components/registration/PasswordInput';
import { registrationService } from '../../../services/registrationService';

export interface PersonalDetailsFormData {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  businessName: string;
  licenceNumber: string;
  licenceExpiry: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface PersonalDetailsProps {
  role: RegistrableRoleType;
  formData: PersonalDetailsFormData;
  onChangeField: (field: keyof PersonalDetailsFormData, value: string) => void;
  onBack: () => void;
  onContinueToVerification: () => Promise<void>;
}

export const PersonalDetails: React.FC<PersonalDetailsProps> = ({
  role,
  formData,
  onChangeField,
  onBack,
  onContinueToVerification,
}) => {
  const [errors, setErrors] = useState<Partial<Record<keyof PersonalDetailsFormData, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const validateAll = (): boolean => {
    const nextErrors: Partial<Record<keyof PersonalDetailsFormData, string>> = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      nextErrors.fullName = 'Please enter your full name (at least 2 characters).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    const cleanMobile = formData.mobile.trim().replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      nextErrors.mobile = 'Please enter a valid 10-digit Indian mobile number (starting with 6-9).';
    }

    if (formData.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters long.';
    } else if (!/[A-Za-z]/.test(formData.password) || !/\d/.test(formData.password)) {
      nextErrors.password = 'Password must contain both letters and numbers.';
    }

    if (formData.confirmPassword !== formData.password) {
      nextErrors.confirmPassword = 'Confirm password does not match password.';
    }

    if (role === 'operator') {
      if (!formData.licenceNumber.trim() || formData.licenceNumber.trim().length < 6) {
        nextErrors.licenceNumber = 'Valid Driving Licence Number is required for Operators.';
      }
      if (!formData.licenceExpiry) {
        nextErrors.licenceExpiry = 'Driving Licence Expiry Date is required.';
      } else {
        const expDate = new Date(formData.licenceExpiry);
        if (expDate <= new Date()) {
          nextErrors.licenceExpiry = 'Driving Licence must not be expired.';
        }
      }
    }

    if (!formData.address.trim()) {
      nextErrors.address = 'Address is required.';
    }
    if (!formData.city.trim()) {
      nextErrors.city = 'City is required.';
    }
    if (!formData.state.trim()) {
      nextErrors.state = 'State is required.';
    }
    if (!/^\d{6}$/.test(formData.pincode.trim())) {
      nextErrors.pincode = 'Enter a valid 6-digit PIN Code.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateAll()) return;

    setIsChecking(true);
    try {
      const [emailCheck, mobileCheck] = await Promise.all([
        registrationService.checkEmailAvailability(formData.email),
        registrationService.checkMobileAvailability(formData.mobile),
      ]);

      const dupErrors: Partial<Record<keyof PersonalDetailsFormData, string>> = {};
      if (!emailCheck.available) {
        dupErrors.email = emailCheck.message || 'This email address is already registered.';
      }
      if (!mobileCheck.available) {
        dupErrors.mobile = mobileCheck.message || 'This mobile number is already registered.';
      }

      if (Object.keys(dupErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...dupErrors }));
        setIsChecking(false);
        return;
      }

      await onContinueToVerification();
    } catch (err: any) {
      setApiError(err.message || 'Could not validate details with the server.');
    } finally {
      setIsChecking(false);
    }
  };

  const roleBadgeLabel =
    role === 'customer'
      ? 'Customer Account'
      : role === 'owner'
      ? 'Vehicle Owner Account'
      : 'Operator / Driver Account';

  return (
    <form className="reg-step-two-form" onSubmit={handleSubmit} noValidate>
      <div className="reg-step-header-bar">
        <h2 className="reg-step-section-heading" style={{ marginBottom: 0 }}>
          Enter Your Details
        </h2>
        <span className="reg-selected-role-pill">{roleBadgeLabel}</span>
      </div>

      {apiError && (
        <div className="reg-alert-banner reg-alert-error" role="alert">
          <AlertCircle size={17} />
          <span>{apiError}</span>
        </div>
      )}

      {/* Common Personal Fields */}
      <FormInput
        label="Full Name *"
        placeholder="Enter your full name"
        value={formData.fullName}
        onChange={(e) => onChangeField('fullName', e.target.value)}
        error={errors.fullName}
        required
      />

      <div className="reg-grid-2-cols">
        <FormInput
          label="Email Address *"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => onChangeField('email', e.target.value)}
          error={errors.email}
          required
        />

        <FormInput
          label="Mobile Number *"
          type="tel"
          placeholder="10-digit Indian mobile number"
          maxLength={10}
          value={formData.mobile}
          onChange={(e) => onChangeField('mobile', e.target.value.replace(/\D/g, ''))}
          error={errors.mobile}
          required
        />
      </div>

      <div className="reg-grid-2-cols">
        <PasswordInput
          label="Password *"
          placeholder="Min 8 chars (letters & numbers)"
          value={formData.password}
          onChange={(e) => onChangeField('password', e.target.value)}
          error={errors.password}
          required
        />

        <PasswordInput
          label="Confirm Password *"
          placeholder="Re-enter your password"
          value={formData.confirmPassword}
          onChange={(e) => onChangeField('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
          required
        />
      </div>

      {/* Dynamic Role-Specific Fields */}
      {role === 'owner' && (
        <FormInput
          label="Business Name"
          optionalText="optional"
          placeholder="e.g. Sri Lakshmi Travels & Agro Fleet"
          value={formData.businessName}
          onChange={(e) => onChangeField('businessName', e.target.value)}
          error={errors.businessName}
        />
      )}

      {role === 'operator' && (
        <div className="reg-grid-2-cols">
          <FormInput
            label="Driving Licence Number *"
            placeholder="e.g. TS33 20190048291"
            value={formData.licenceNumber}
            onChange={(e) => onChangeField('licenceNumber', e.target.value.toUpperCase())}
            error={errors.licenceNumber}
            required
          />

          <FormInput
            label="Licence Expiry Date *"
            type="date"
            value={formData.licenceExpiry}
            onChange={(e) => onChangeField('licenceExpiry', e.target.value)}
            error={errors.licenceExpiry}
            required
          />
        </div>
      )}

      {/* Address Fields (Required for all roles) */}
      <FormInput
        label="Address *"
        placeholder="House No., Street, Village / Locality"
        value={formData.address}
        onChange={(e) => onChangeField('address', e.target.value)}
        error={errors.address}
        required
      />

      <div className="reg-grid-3-cols">
        <FormInput
          label="City *"
          placeholder="City / Town"
          value={formData.city}
          onChange={(e) => onChangeField('city', e.target.value)}
          error={errors.city}
          required
        />

        <FormInput
          label="State *"
          placeholder="State"
          value={formData.state}
          onChange={(e) => onChangeField('state', e.target.value)}
          error={errors.state}
          required
        />

        <FormInput
          label="PIN Code *"
          placeholder="6-digit PIN"
          maxLength={6}
          value={formData.pincode}
          onChange={(e) => onChangeField('pincode', e.target.value.replace(/\D/g, ''))}
          error={errors.pincode}
          required
        />
      </div>

      <div className="reg-step-action-row">
        <button
          type="button"
          className="reg-back-outline-btn"
          onClick={onBack}
          disabled={isChecking}
        >
          <ArrowLeft size={17} />
          <span>Back</span>
        </button>

        <button
          type="submit"
          className="reg-continue-cta-btn"
          style={{ flex: 1 }}
          disabled={isChecking}
        >
          <span>{isChecking ? 'Validating & Sending OTP...' : 'Continue'}</span>
          <ArrowRight size={19} />
        </button>
      </div>
    </form>
  );
};
