
import React, { useState } from 'react';
import { useCompany } from '@/context/CompanyContext';
import Button from '../common/Button';
import Card from '../common/Card';
import { Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionPlansProps {
  onComplete: () => void;
  onBack: () => void;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onComplete, onBack }) => {
  const { company, updateCompany, registerCompany } = useCompany();
  const [isRegistering, setIsRegistering] = useState(false);

  const handlePlanSelect = (type: 'monthly' | 'annual') => {
    updateCompany({ subscriptionType: type });
  };

  const handleSubscribe = async () => {
    if (!company.subscriptionType) {
      toast({
        title: "Selecione um plano",
        description: "Por favor, selecione um plano para continuar",
        variant: "destructive"
      });
      return;
    }
    
    setIsRegistering(true);
    
    try {
      // Log auth status before registration
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("Auth status before registration:", sessionData);
      
      const success = await registerCompany();
      if (success) {
        // Verify registration was successful
        const { data: newSessionData } = await supabase.auth.getSession();
        console.log("Auth status after registration:", newSessionData);
        
        onComplete();
      } else {
        setIsRegistering(false);
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Erro no registro",
        description: "Não foi possível concluir o registro",
        variant: "destructive"
      });
      setIsRegistering(false);
    }
  };

  // Features comuns em ambos os planos
  const commonFeatures = [
    'Dashboard personalizado',
    'Gestão de clientes',
    'Cadastro de serviços',
    'Relatórios básicos',
    'Suporte por e-mail',
  ];

  return (
    
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-semibold mb-2">Escolha seu Plano</h2>
      <p className="text-gray-600 mb-8">Selecione a forma de pagamento que mais se adequa às suas necessidades.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Plano Mensal */}
        <div 
          onClick={() => handlePlanSelect('monthly')}
          className="cursor-pointer"
        >
          <Card 
            highlighted={company.subscriptionType === 'monthly'}
            className={`h-full transition-all duration-200 hover:shadow-lg ${company.subscriptionType === 'monthly' ? 'transform translate-y-[-4px]' : ''}`}
          >
            <div className="flex flex-col h-full">
              <div className="p-6 border-b">
                <h3 className="text-xl font-medium mb-2">Plano Mensal</h3>
                <div className="flex items-end mb-4">
                  <span className="text-3xl font-bold">19,99 €</span>
                  <span className="text-gray-600 ml-1">/mês</span>
                </div>
                <p className="text-sm text-gray-600">Flexibilidade para seus negócios</p>
              </div>
              
              <div className="flex-grow p-6">
                <ul className="space-y-3">
                  {commonFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check size={18} className="text-primary mr-2 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="p-6 pt-0">
                <Button 
                  variant={company.subscriptionType === 'monthly' ? 'primary' : 'secondary'}
                  fullWidth
                  onClick={() => handlePlanSelect('monthly')}
                >
                  Assinar Mensal — 19,99 €/mês
                </Button>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Plano Anual */}
        <div 
          onClick={() => handlePlanSelect('annual')}
          className="cursor-pointer relative"
        >
          <div className="absolute -top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
            -20%
          </div>
          
          <Card 
            highlighted={company.subscriptionType === 'annual'}
            className={`h-full transition-all duration-200 hover:shadow-lg bg-blue-50 ${company.subscriptionType === 'annual' ? 'transform translate-y-[-4px]' : ''}`}
          >
            <div className="flex flex-col h-full">
              <div className="p-6 border-b">
                <h3 className="text-xl font-medium mb-2">Plano Anual</h3>
                <div className="flex items-end mb-4">
                  <span className="text-3xl font-bold">191,90 €</span>
                  <span className="text-gray-600 ml-1">/ano</span>
                </div>
                <p className="text-sm text-gray-600">
                  <span className="line-through text-gray-400 mr-1">239,88 €</span>
                  Economia de 47,98 €
                </p>
              </div>
              
              <div className="flex-grow p-6">
                <ul className="space-y-3">
                  {commonFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check size={18} className="text-primary mr-2 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  <li className="flex items-center">
                    <Check size={18} className="text-primary mr-2 flex-shrink-0" />
                    <span className="text-sm font-medium">Relatórios avançados</span>
                  </li>
                  <li className="flex items-center">
                    <Check size={18} className="text-primary mr-2 flex-shrink-0" />
                    <span className="text-sm font-medium">Suporte prioritário</span>
                  </li>
                </ul>
              </div>
              
              <div className="p-6 pt-0">
                <Button 
                  variant={company.subscriptionType === 'annual' ? 'primary' : 'secondary'}
                  fullWidth
                  onClick={() => handlePlanSelect('annual')}
                >
                  Assinar Anual — 191,90 €/ano
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      <div className="flex justify-between pt-6">
        <Button variant="secondary" onClick={onBack} disabled={isRegistering}>
          Voltar
        </Button>
        <Button
          onClick={handleSubscribe}
          disabled={!company.subscriptionType || isRegistering}
          loading={isRegistering}
        >
          {isRegistering ? 'Processando...' : 'Finalizar Assinatura'}
        </Button>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
