import React from 'react';
import { ArrowRight } from 'lucide-react';
import {
  RoleSelectionCard,
  RegistrableRoleType,
} from '../../../components/registration/RoleSelectionCard';

interface RoleSelectionProps {
  selectedRole: RegistrableRoleType;
  onSelectRole: (role: RegistrableRoleType) => void;
  onContinue: () => void;
  onGoToLogin: () => void;
}

const CustomerIllustration = () => (
  <svg viewBox="0 0 96 86" width="84" height="76" aria-hidden="true">
    {/* Soft circular backdrop */}
    <circle cx="46" cy="46" r="36" fill="#D5F0DC" />
    {/* Hair back */}
    <path
      d="M24 38 C24 16, 60 16, 60 38 L64 72 L20 72 Z"
      fill="#1A202C"
    />
    {/* Yellow top / kurta */}
    <path
      d="M16 84 C19 58, 65 58, 68 84 Z"
      fill="#FACC15"
    />
    {/* Collar detail */}
    <path d="M35 61 Q42 68 49 61" stroke="#CA8A04" strokeWidth="2" fill="none" />
    {/* Neck */}
    <rect x="38" y="49" width="8" height="12" rx="3" fill="#E2A37E" />
    {/* Face */}
    <ellipse cx="42" cy="36" rx="12" ry="14" fill="#F1B896" />
    {/* Hair front sweep */}
    <path
      d="M30 32 C32 22, 48 21, 54 32 C54 22, 46 18, 39 18 C32 18, 28 24, 30 32 Z"
      fill="#1A202C"
    />
    {/* Eyes & smile */}
    <circle cx="38" cy="35" r="1.4" fill="#1F2937" />
    <circle cx="46.5" cy="35" r="1.4" fill="#1F2937" />
    <circle cx="42.2" cy="31.5" r="1" fill="#B91C1C" />
    <path
      d="M39 41.5 Q42.5 44.5 46 41.5"
      stroke="#9A3412"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
    {/* Smartphone in right hand */}
    <g transform="translate(58, 43) rotate(12)">
      <rect x="0" y="0" width="14" height="25" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1" />
      <rect x="2" y="3" width="10" height="18" rx="1.5" fill="#38BDF8" opacity="0.35" />
    </g>
    {/* Hand holding phone */}
    <path
      d="M52 74 L61 58 C63 55, 67 57, 65 61 L58 78 Z"
      fill="#F1B896"
    />
  </svg>
);

const VehicleOwnerIllustration = () => (
  <svg viewBox="0 0 110 86" width="94" height="76" aria-hidden="true">
    {/* Soft circular backdrop */}
    <circle cx="52" cy="46" r="35" fill="#FDEBD0" />
    {/* Yellow/White Commercial Truck on Right */}
    <g transform="translate(50, 28)">
      {/* Cargo container */}
      <rect x="0" y="0" width="38" height="32" rx="3" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
      <line x1="8" y1="2" x2="8" y2="30" stroke="#94A3B8" strokeWidth="1" />
      <line x1="16" y1="2" x2="16" y2="30" stroke="#94A3B8" strokeWidth="1" />
      <line x1="24" y1="2" x2="24" y2="30" stroke="#94A3B8" strokeWidth="1" />
      {/* Yellow Truck Cab */}
      <path d="M24 6 L48 6 C52 6, 54 9, 54 14 L54 36 L24 36 Z" fill="#F59E0B" />
      {/* Windshield */}
      <rect x="28" y="10" width="22" height="11" rx="2" fill="#1E293B" />
      {/* Grille & Headlights */}
      <rect x="32" y="25" width="14" height="5" rx="1" fill="#1F2937" />
      <rect x="27" y="26" width="4" height="3" rx="1" fill="#FEF08A" />
      <rect x="47" y="26" width="4" height="3" rx="1" fill="#FEF08A" />
      {/* Bumper & Wheels */}
      <rect x="23" y="33" width="32" height="5" rx="2" fill="#334155" />
      <circle cx="14" cy="38" r="6" fill="#1E293B" />
      <circle cx="14" cy="38" r="2.5" fill="#94A3B8" />
      <circle cx="32" cy="38" r="6" fill="#1E293B" />
      <circle cx="32" cy="38" r="2.5" fill="#94A3B8" />
      <circle cx="47" cy="38" r="6" fill="#1E293B" />
      <circle cx="47" cy="38" r="2.5" fill="#94A3B8" />
    </g>
    {/* Bearded Vehicle Owner on Left */}
    <g transform="translate(6, 10)">
      {/* Shirt */}
      <path d="M6 74 C9 46, 51 46, 54 74 Z" fill="#C26D2D" />
      {/* Neck */}
      <rect x="25" y="37" width="9" height="10" fill="#D99B72" />
      {/* Face */}
      <ellipse cx="29.5" cy="26" rx="10.5" ry="12.5" fill="#E5A982" />
      {/* Beard & Moustache */}
      <path
        d="M19.5 27 C20 36, 25 39, 29.5 39 C34 39, 39 36, 39.5 27 L37 27 C36 32, 33 34, 29.5 34 C26 34, 23 32, 22 27 Z"
        fill="#1F2937"
      />
      <path d="M25 30 Q29.5 28 34 30" stroke="#1F2937" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* Cap */}
      <path d="M18 20 C19 11, 40 11, 41 20 Z" fill="#D97706" />
      <path d="M18 19 Q29.5 16 44 20" stroke="#B45309" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Eyes */}
      <circle cx="26" cy="24" r="1.3" fill="#1F2937" />
      <circle cx="33" cy="24" r="1.3" fill="#1F2937" />
      {/* Crossed arms */}
      <path d="M12 62 Q29.5 55 47 62" stroke="#E5A982" strokeWidth="6" fill="none" strokeLinecap="round" />
    </g>
  </svg>
);

const OperatorDriverIllustration = () => (
  <svg viewBox="0 0 110 86" width="94" height="76" aria-hidden="true">
    {/* Cab interior backdrop */}
    <rect x="16" y="14" width="78" height="64" rx="18" fill="#E2E8F0" />
    <rect x="46" y="20" width="42" height="36" rx="6" fill="#CBD5E1" />
    {/* Driver Seat */}
    <rect x="18" y="28" width="12" height="44" rx="5" fill="#334155" />
    {/* Driver White Uniform Shirt */}
    <path d="M18 82 C21 54, 65 54, 68 82 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
    {/* Collar */}
    <path d="M35 56 L43 65 L51 56" fill="#E2E8F0" />
    {/* Neck */}
    <rect x="39" y="45" width="9" height="11" fill="#DF9E76" />
    {/* Face */}
    <ellipse cx="43.5" cy="33" rx="11" ry="13" fill="#ECA882" />
    {/* Hair */}
    <path
      d="M32.5 29 C32.5 18, 54.5 18, 54.5 29 C53 23, 48 21, 43.5 21 C38 21, 34 24, 32.5 29 Z"
      fill="#111827"
    />
    {/* Eyes & Moustache */}
    <circle cx="40" cy="32" r="1.4" fill="#111827" />
    <circle cx="47.5" cy="32" r="1.4" fill="#111827" />
    <path d="M39 38 Q43.5 36 48 38" stroke="#111827" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    {/* Steering Wheel */}
    <circle cx="56" cy="68" r="16" stroke="#1E293B" strokeWidth="4.5" fill="none" />
    <circle cx="56" cy="68" r="4.5" fill="#1E293B" />
    <line x1="42" y1="64" x2="70" y2="64" stroke="#1E293B" strokeWidth="3.5" />
    <line x1="56" y1="68" x2="56" y2="82" stroke="#1E293B" strokeWidth="3.5" />
    {/* Hands on wheel */}
    <circle cx="41" cy="62" r="3.8" fill="#ECA882" />
    <circle cx="71" cy="62" r="3.8" fill="#ECA882" />
  </svg>
);

export const RoleSelection: React.FC<RoleSelectionProps> = ({
  selectedRole,
  onSelectRole,
  onContinue,
  onGoToLogin,
}) => {
  return (
    <div className="reg-step-one-container">
      <h2 className="reg-step-section-heading">Select your account type</h2>

      <div className="reg-role-cards-stack" role="radiogroup" aria-label="Account Type">
        <RoleSelectionCard
          role="customer"
          title="Customer"
          description="Book vehicles for travel, transport or work"
          isSelected={selectedRole === 'customer'}
          onSelect={onSelectRole}
          illustration={<CustomerIllustration />}
        />

        <RoleSelectionCard
          role="owner"
          title="Vehicle Owner"
          description="List your vehicles and earn bookings"
          isSelected={selectedRole === 'owner'}
          onSelect={onSelectRole}
          illustration={<VehicleOwnerIllustration />}
        />

        <RoleSelectionCard
          role="operator"
          title="Operator / Driver"
          description="Manage trips and operate vehicles"
          isSelected={selectedRole === 'operator'}
          onSelect={onSelectRole}
          illustration={<OperatorDriverIllustration />}
        />
      </div>

      <button
        type="button"
        className="reg-continue-cta-btn"
        onClick={onContinue}
      >
        <span>Continue</span>
        <ArrowRight size={20} strokeWidth={2.5} />
      </button>

      <div className="reg-bottom-login-divider" />

      <p className="reg-bottom-login-prompt">
        Already have an account?{' '}
        <button
          type="button"
          className="reg-inline-login-link"
          onClick={onGoToLogin}
        >
          Login
        </button>
      </p>
    </div>
  );
};
