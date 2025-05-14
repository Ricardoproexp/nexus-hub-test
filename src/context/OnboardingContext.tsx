
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCompany } from './CompanyContext';

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

const OnboardingContext = createContext<OnboardingContextData>({
  steps: [],
  currentStep: 1,
  completeStep: () => {},
  setCurrentStep: () => {},
  isOnboardingComplete: false,
});

export const useOnboarding = () => useContext(OnboardingContext);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { company } = useCompany();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  // Atualiza os passos com base no segmento selecionado
  useEffect(() => {
    let stepDescriptions;

    switch(company.segment) {
      case 'barbearia':
        stepDescriptions = [
          {
            id: 1,
            title: 'Configure seu perfil',
            description: 'Adicione informações sobre sua barbearia',
            completed: false,
          },
          {
            id: 2,
            title: 'Adicione seus serviços',
            description: 'Cadastre os serviços que sua barbearia oferece',
            completed: false,
          },
          {
            id: 3,
            title: 'Comece a gerenciar clientes',
            description: 'Adicione seus primeiros clientes',
            completed: false,
          },
        ];
        break;
      case 'cabeleireiro':
        stepDescriptions = [
          {
            id: 1,
            title: 'Configure seu perfil',
            description: 'Adicione informações sobre seu salão',
            completed: false,
          },
          {
            id: 2,
            title: 'Adicione seus serviços',
            description: 'Cadastre os serviços que seu salão oferece',
            completed: false,
          },
          {
            id: 3,
            title: 'Comece a gerenciar clientes',
            description: 'Adicione seus primeiros clientes',
            completed: false,
          },
        ];
        break;
      case 'restaurante':
        stepDescriptions = [
          {
            id: 1,
            title: 'Configure seu perfil',
            description: 'Adicione informações sobre seu restaurante',
            completed: false,
          },
          {
            id: 2,
            title: 'Adicione itens ao cardápio',
            description: 'Cadastre os pratos que seu restaurante oferece',
            completed: false,
          },
          {
            id: 3,
            title: 'Comece a gerenciar reservas',
            description: 'Configure o sistema de reservas',
            completed: false,
          },
        ];
        break;
      default:
        stepDescriptions = [
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
    }

    setSteps(stepDescriptions);
  }, [company.segment]);

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
