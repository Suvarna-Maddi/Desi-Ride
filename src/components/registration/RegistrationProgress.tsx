import React from 'react';
import { Check } from 'lucide-react';

interface RegistrationProgressProps {
  currentStep: 1 | 2 | 3;
}

export const RegistrationProgress: React.FC<RegistrationProgressProps> = ({ currentStep }) => {
  const steps = [
    { num: 1, label: 'Choose Role' },
    { num: 2, label: 'Your Details' },
    { num: 3, label: 'Verification' },
  ];

  return (
    <div className="reg-progress-container" aria-label="Registration Progress">
      <div className="reg-progress-track">
        {steps.map((step, index) => {
          const isActive = currentStep === step.num;
          const isCompleted = currentStep > step.num;

          return (
            <React.Fragment key={step.num}>
              <div
                className={`reg-progress-node ${
                  isActive ? 'active' : isCompleted ? 'completed' : 'upcoming'
                }`}
              >
                <div className="reg-progress-circle">
                  {isCompleted ? <Check size={16} strokeWidth={3} /> : step.num}
                </div>
                <span className="reg-progress-label">{step.label}</span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`reg-progress-line ${
                    currentStep > step.num ? 'line-completed' : ''
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
