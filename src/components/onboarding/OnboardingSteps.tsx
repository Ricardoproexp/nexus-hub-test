
import React from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import { useCompany } from '@/context/CompanyContext';
import Button from '../common/Button';
import Card from '../common/Card';
import { Check, UserCircle, BookOpen, Users, Utensils, Scissors, Calendar } from 'lucide-react';

interface OnboardingStepsProps {
  onComplete: () => void;
}

const OnboardingSteps: React.FC<OnboardingStepsProps> = ({ onComplete }) => {
  const { steps, currentStep, setCurrentStep, completeStep } = useOnboarding();
  const { company } = useCompany();

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

  // Personalização de acordo com o segmento
  const getSegmentSpecificContent = (step: number) => {
    if (step === 1) {
      // Step 1: Configurar perfil (igual para todos segmentos)
      return {
        title: 'Configure seu perfil',
        description: 'Adicione informações sobre sua empresa',
        icon: <UserCircle size={24} />,
        content: (
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
        )
      };
    } else if (step === 2) {
      // Step 2: Adicionar serviços/produtos (personalizado por segmento)
      switch(company.segment) {
        case 'barbearia':
          return {
            title: 'Adicione seus serviços',
            description: 'Cadastre os serviços que sua barbearia oferece',
            icon: <Scissors size={24} />,
            content: (
              <div className="space-y-4">
                <p className="text-sm">Adicione os serviços que sua barbearia oferece, com preços e descrições.</p>
                <div className="border border-gray-200 rounded-md p-4">
                  <h4 className="text-sm font-medium mb-2">Adicionar novo serviço</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      className="form-input" 
                      placeholder="Nome do serviço (ex: Corte de Cabelo)" 
                    />
                    <input 
                      className="form-input"
                      placeholder="Preço (€)"
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
            )
          };
        case 'cabeleireiro':
          return {
            title: 'Adicione seus serviços',
            description: 'Cadastre os serviços que seu salão oferece',
            icon: <Scissors size={24} />,
            content: (
              <div className="space-y-4">
                <p className="text-sm">Adicione os serviços que seu salão oferece, com preços e descrições.</p>
                <div className="border border-gray-200 rounded-md p-4">
                  <h4 className="text-sm font-medium mb-2">Adicionar novo serviço</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      className="form-input" 
                      placeholder="Nome do serviço (ex: Coloração)" 
                    />
                    <input 
                      className="form-input"
                      placeholder="Preço (€)"
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
            )
          };
        case 'restaurante':
          return {
            title: 'Adicione itens ao cardápio',
            description: 'Cadastre os pratos que seu restaurante oferece',
            icon: <Utensils size={24} />,
            content: (
              <div className="space-y-4">
                <p className="text-sm">Adicione os itens do cardápio que seu restaurante oferece, com preços e descrições.</p>
                <div className="border border-gray-200 rounded-md p-4">
                  <h4 className="text-sm font-medium mb-2">Adicionar novo item</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      className="form-input" 
                      placeholder="Nome do prato" 
                    />
                    <input 
                      className="form-input"
                      placeholder="Preço (€)"
                      type="number"
                    />
                  </div>
                  <textarea 
                    className="form-input mt-4" 
                    rows={2} 
                    placeholder="Descrição do prato e ingredientes"
                  />
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <select className="form-input">
                      <option value="">Categoria</option>
                      <option value="entradas">Entradas</option>
                      <option value="principais">Pratos Principais</option>
                      <option value="sobremesas">Sobremesas</option>
                      <option value="bebidas">Bebidas</option>
                    </select>
                    <input 
                      className="form-input"
                      placeholder="Tempo de preparo (min)"
                      type="number"
                    />
                  </div>
                  <Button variant="secondary" className="mt-4" size="sm">
                    Adicionar ao Cardápio
                  </Button>
                </div>
              </div>
            )
          };
        default:
          return {
            title: 'Adicione seus produtos',
            description: 'Cadastre os produtos ou serviços que você oferece',
            icon: <BookOpen size={24} />,
            content: (
              <div className="space-y-4">
                <p className="text-sm">Adicione os produtos ou serviços que sua empresa oferece.</p>
                <div className="border border-gray-200 rounded-md p-4">
                  <h4 className="text-sm font-medium mb-2">Adicionar novo item</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      className="form-input" 
                      placeholder="Nome do produto/serviço" 
                    />
                    <input 
                      className="form-input"
                      placeholder="Preço (€)"
                      type="number"
                    />
                  </div>
                  <textarea 
                    className="form-input mt-4" 
                    rows={2} 
                    placeholder="Descrição"
                  />
                  <Button variant="secondary" className="mt-4" size="sm">
                    Adicionar Item
                  </Button>
                </div>
              </div>
            )
          };
      }
    } else if (step === 3) {
      // Step 3: Gestão de clientes ou vendas (personalizado por segmento)
      switch(company.segment) {
        case 'barbearia':
        case 'cabeleireiro':
          return {
            title: 'Comece a gerenciar clientes',
            description: 'Adicione seus clientes para gerenciar agendamentos',
            icon: <Users size={24} />,
            content: (
              <div className="space-y-4">
                <p className="text-sm">Comece a adicionar seus clientes para gerenciar agendamentos.</p>
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
            )
          };
        case 'restaurante':
          return {
            title: 'Comece a gerenciar reservas',
            description: 'Configure o sistema de reservas do seu restaurante',
            icon: <Calendar size={24} />,
            content: (
              <div className="space-y-4">
                <p className="text-sm">Configure o sistema de reservas do seu restaurante.</p>
                <div className="border border-gray-200 rounded-md p-4">
                  <h4 className="text-sm font-medium mb-2">Configuração de mesas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      className="form-input" 
                      placeholder="Número total de mesas" 
                      type="number"
                    />
                    <select className="form-input">
                      <option value="">Horário de funcionamento</option>
                      <option value="almoco">Somente almoço</option>
                      <option value="jantar">Somente jantar</option>
                      <option value="ambos">Almoço e jantar</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <input 
                      className="form-input"
                      placeholder="Duração média da reserva (min)"
                      type="number"
                    />
                    <input 
                      className="form-input"
                      placeholder="Intervalo entre reservas (min)"
                      type="number"
                    />
                  </div>
                  <Button variant="secondary" className="mt-4" size="sm">
                    Salvar Configurações
                  </Button>
                </div>
              </div>
            )
          };
        default:
          return {
            title: 'Comece a gerenciar vendas',
            description: 'Adicione seus clientes e vendas',
            icon: <Users size={24} />,
            content: (
              <div className="space-y-4">
                <p className="text-sm">Comece a adicionar seus clientes e registrar vendas.</p>
                <div className="border border-gray-200 rounded-md p-4">
                  <h4 className="text-sm font-medium mb-2">Adicionar novo cliente</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      className="form-input" 
                      placeholder="Nome do cliente" 
                    />
                    <input 
                      className="form-input"
                      placeholder="E-mail"
                      type="email"
                    />
                  </div>
                  <Button variant="secondary" className="mt-4" size="sm">
                    Adicionar Cliente
                  </Button>
                </div>
              </div>
            )
          };
      }
    }
    
    // Fallback
    return {
      title: `Passo ${step}`,
      description: 'Complete este passo',
      icon: <Check size={24} />,
      content: <p>Conteúdo do passo {step}</p>
    };
  };

  const currentStepContent = getSegmentSpecificContent(currentStep);

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
              {currentStepContent.icon}
            </div>
            <div>
              <h3 className="text-lg font-medium">{currentStepContent.title}</h3>
              <p className="text-sm text-gray-600">{currentStepContent.description}</p>
            </div>
          </div>
          
          {currentStepContent.content}
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
