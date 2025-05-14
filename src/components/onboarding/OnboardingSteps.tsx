
import React from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import Button from '../common/Button';
import Card from '../common/Card';
import { Check, UserCircle, BookOpen, Users } from 'lucide-react';

interface OnboardingStepsProps {
  onComplete: () => void;
}

const OnboardingSteps: React.FC<OnboardingStepsProps> = ({ onComplete }) => {
  const { steps, currentStep, setCurrentStep, completeStep } = useOnboarding();

  const handleStepChange = (stepId: number) => {
    setCurrentStep(stepId);
  };

  const handleCompleteStep = () => {
    completeStep(currentStep);
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const stepIcons = [
    <UserCircle key="profile" size={24} />,
    <BookOpen key="services" size={24} />,
    <Users key="clients" size={24} />,
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Bem-vindo ao NexusHub!</h2>
        <p className="text-gray-600">Vamos configurar sua conta em 3 passos simples.</p>
      </div>
      
      <div className="flex justify-center mb-8">
        <div className="flex items-center w-full max-w-2xl">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div 
                className={`flex items-center justify-center rounded-full w-10 h-10 ${
                  step.completed 
                    ? 'bg-primary text-white' 
                    : currentStep === step.id 
                      ? 'bg-primary bg-opacity-10 text-primary border-2 border-primary' 
                      : 'bg-gray-100 text-gray-500'
                }`}
                onClick={() => handleStepChange(step.id)}
              >
                {step.completed ? <Check size={20} /> : index + 1}
              </div>
              
              {index < steps.length - 1 && (
                <div className={`flex-grow h-1 mx-2 ${
                  steps[index].completed ? 'bg-primary' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      <Card>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="bg-primary bg-opacity-10 p-3 rounded-full mr-4">
              {stepIcons[currentStep - 1]}
            </div>
            <div>
              <h3 className="text-lg font-medium">{steps[currentStep - 1].title}</h3>
              <p className="text-sm text-gray-600">{steps[currentStep - 1].description}</p>
            </div>
          </div>
          
          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm">Adicione informações sobre sua empresa, como logo, descrição e horário de funcionamento.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center">
                  <UserCircle size={40} className="text-gray-400 mb-2" />
                  <p className="text-sm text-center text-gray-500">Clique para adicionar um logo</p>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <label className="form-label">Descrição</label>
                  <textarea 
                    className="form-input" 
                    rows={3} 
                    placeholder="Descreva sua empresa em poucas palavras"
                  />
                </div>
              </div>
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm">Adicione os serviços que sua empresa oferece, com preços e descrições.</p>
              <div className="border border-gray-200 rounded-md p-4">
                <h4 className="text-sm font-medium mb-2">Adicionar novo serviço</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    className="form-input" 
                    placeholder="Nome do serviço" 
                  />
                  <input 
                    className="form-input"
                    placeholder="Preço (R$)"
                    type="number"
                  />
                </div>
                <textarea 
                  className="form-input mt-4" 
                  rows={2} 
                  placeholder="Descrição do serviço"
                />
                <Button variant="secondary" className="mt-4" size="sm">
                  Adicionar Serviço
                </Button>
              </div>
            </div>
          )}
          
          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-sm">Comece a adicionar seus clientes para gerenciar atendimentos.</p>
              <div className="border border-gray-200 rounded-md p-4">
                <h4 className="text-sm font-medium mb-2">Adicionar novo cliente</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    className="form-input" 
                    placeholder="Nome do cliente" 
                  />
                  <input 
                    className="form-input"
                    placeholder="Telefone"
                    type="tel"
                  />
                </div>
                <input 
                  className="form-input mt-4"
                  placeholder="E-mail"
                  type="email"
                />
                <Button variant="secondary" className="mt-4" size="sm">
                  Adicionar Cliente
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t p-4 flex justify-between">
          <Button 
            variant="secondary"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            Anterior
          </Button>
          <Button onClick={handleCompleteStep}>
            {currentStep === steps.length ? 'Concluir' : 'Próximo'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default OnboardingSteps;
