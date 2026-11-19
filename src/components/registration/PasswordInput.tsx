import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  error,
  id,
  ...rest
}) => {
  const [visible, setVisible] = useState(false);
  const inputId = id || `pwd-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="reg-form-field">
      <label htmlFor={inputId} className="reg-form-label">
        {label}
      </label>
      <div className="reg-password-wrap">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={`reg-form-input reg-password-input ${error ? 'input-error' : ''}`}
          {...rest}
        />
        <button
          type="button"
          className="reg-password-eye-btn"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {error && <span className="reg-field-error-text">{error}</span>}
    </div>
  );
};
