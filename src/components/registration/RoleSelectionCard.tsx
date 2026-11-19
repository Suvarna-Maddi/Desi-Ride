import React from 'react';
import { Check } from 'lucide-react';

export type RegistrableRoleType = 'customer' | 'owner' | 'operator';

interface RoleSelectionCardProps {
  role: RegistrableRoleType;
  title: string;
  description: string;
  isSelected: boolean;
  onSelect: (role: RegistrableRoleType) => void;
  illustration: React.ReactNode;
}

export const RoleSelectionCard: React.FC<RoleSelectionCardProps> = ({
  role,
  title,
  description,
  isSelected,
  onSelect,
  illustration,
}) => {
  return (
    <div
      className={`reg-role-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(role)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(role);
        }
      }}
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
    >
      <div className="reg-role-illustration-wrap">{illustration}</div>

      <div className="reg-role-text-col">
        <h3 className="reg-role-title">{title}</h3>
        <p className="reg-role-desc">{description}</p>
      </div>

      <div className={`reg-role-radio-indicator ${isSelected ? 'checked' : ''}`}>
        {isSelected && <Check size={14} strokeWidth={3.2} color="#FFFFFF" />}
      </div>
    </div>
  );
};
