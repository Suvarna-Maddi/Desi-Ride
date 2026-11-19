import React, { useRef } from 'react';

interface OTPInputProps {
  value: string;
  onChange: (otp: string) => void;
  disabled?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({ value, onChange, disabled }) => {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  const handleDigitChange = (index: number, rawVal: string) => {
    const clean = rawVal.replace(/\D/g, '');
    if (!clean) {
      const next = [...digits];
      next[index] = '';
      onChange(next.join(''));
      return;
    }

    // Support pasting full 6-digit OTP
    if (clean.length > 1) {
      const pasted = clean.slice(0, 6);
      onChange(pasted);
      const focusIdx = Math.min(pasted.length, 5);
      inputsRef.current[focusIdx]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = clean[0];
    onChange(next.join(''));

    if (index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="reg-otp-boxes" role="group" aria-label="6-Digit OTP Input">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleDigitChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="reg-otp-digit-input"
          aria-label={`OTP Digit ${i + 1}`}
        />
      ))}
    </div>
  );
};
