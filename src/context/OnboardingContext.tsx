
import React, { createContext, useContext, useState } from 'react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

interface OnboardingContextData {
  steps: OnboardingStep[];
  currentStep: number;
  completeStep: (stepId: number) => void;
  setCurrentStep: (step: number) => void;
  isOnboardingComplete: boolean;
}

const defaultSteps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Configure seu perfil',
    description: 'Adicione informações sobre sua empresa',
    completed: false,
  },
  {
    id: 2,
    title: 'Adicione seus serviços',
    description: 'Cadastre os serviços que você oferece',
    completed: false,
  },
  {
    id: 3,
    title: 'Comece a gerenciar clientes',
    description: 'Adicione seus primeiros clientes',
    completed: false,
  },
];

const OnboardingContext = createContext<OnboardingContextData>({
  steps: defaultSteps,
  currentStep: 1,
  completeStep: () => {},
  setCurrentStep: () => {},
  isOnboardingComplete: false,
});

export const useOnboarding = () => useContext(OnboardingContext);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [steps, setSteps] = useState<OnboardingStep[]>(defaultSteps);
  const [currentStep, setCurrentStep] = useState(1);

  const completeStep = (stepId: number) => {
    setSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === stepId ? { ...step, completed: true } : step
      )
    );
  };

  const isOnboardingComplete = steps.every((step) => step.completed);

  return (
    <OnboardingContext.Provider
      value={{
        steps,
        currentStep,
        completeStep,
        setCurrentStep,
        isOnboardingComplete,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};
