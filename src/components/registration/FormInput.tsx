import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  optionalText?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  optionalText,
  id,
  ...rest
}) => {
  const inputId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="reg-form-field">
      <label htmlFor={inputId} className="reg-form-label">
        <span>{label}</span>
        {optionalText && <span className="reg-optional-tag">({optionalText})</span>}
      </label>
      <input
        id={inputId}
        className={`reg-form-input ${error ? 'input-error' : ''}`}
        {...rest}
      />
      {error && <span className="reg-field-error-text">{error}</span>}
    </div>
  );
};
