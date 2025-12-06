import React from 'react';
import { FormStep } from '../types';
import { CheckCircle2, Circle } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: FormStep;
}

const steps = [
  { id: FormStep.TEAM_INFO, label: "Team Info" },
  { id: FormStep.MEMBER_INFO, label: "Members" },
  { id: FormStep.PROJECT_DETAILS, label: "Project Details" },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  if (currentStep === FormStep.SUCCESS) return null;

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative z-10">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                  isCompleted
                    ? 'bg-green-600 border-green-600 text-white'
                    : isCurrent
                    ? 'bg-[#bb0000] border-[#bb0000] text-white shadow-lg scale-110'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <span className="font-semibold">{step.id}</span>
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium uppercase tracking-wider ${
                  isCurrent ? 'text-[#bb0000]' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      {/* Connector Line */}
      <div className="absolute top-[4.5rem] left-0 w-full h-0.5 bg-gray-200 -z-0 hidden md:block" />
    </div>
  );
};