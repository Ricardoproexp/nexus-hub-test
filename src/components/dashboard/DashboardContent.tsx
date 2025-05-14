
import React from 'react';
import { useCompany } from '@/context/CompanyContext';
import Card from '../common/Card';
import Button from '../common/Button';
import { Calendar, Users, LineChart, Clock, PlusCircle, Settings, Scissors, Utensils } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DashboardContent: React.FC = () => {
  const { company } = useCompany();
  const { toast } = useToast();
  
  // Obtém o título personalizado com base no segmento
  const getSegmentSpecificTitle = () => {
    switch(company.segment) {
      case 'barbearia':
        return 'Visão Geral da sua Barbearia';
      case 'cabeleireiro':
        return 'Visão Geral do seu Salão';
      case 'restaurante':
        return 'Visão Geral do seu Restaurante';
      default:
        return 'Visão Geral';
    }
  };
  
  // Obtém dados específicos do segmento
  const getSegmentSpecificMetrics = () => {
    switch(company.segment) {
      case 'barbearia':
        return [
          { icon: <Calendar size={24} className="text-blue-500" />, label: 'Agendamentos Hoje', value: '0' },
          { icon: <Users size={24} className="text-green-500" />, label: 'Clientes Ativos', value: '0' },
          { icon: <LineChart size={24} className="text-purple-500" />, label: 'Faturamento Mensal', value: '0 €' },
          { icon: <Clock size={24} className="text-orange-500" />, label: 'Tempo Médio', value: '30 min' },
        ];
      case 'cabeleireiro':
        return [
          { icon: <Calendar size={24} className="text-blue-500" />, label: 'Agendamentos Hoje', value: '0' },
          { icon: <Users size={24} className="text-green-500" />, label: 'Clientes Ativos', value: '0' },
          { icon: <LineChart size={24} className="text-purple-500" />, label: 'Faturamento Mensal', value: '0 €' },
          { icon: <Clock size={24} className="text-orange-500" />, label: 'Tempo Médio', value: '45 min' },
        ];
      case 'restaurante':
        return [
          { icon: <Calendar size={24} className="text-blue-500" />, label: 'Reservas Hoje', value: '0' },
          { icon: <Users size={24} className="text-green-500" />, label: 'Clientes Mês', value: '0' },
          { icon: <LineChart size={24} className="text-purple-500" />, label: 'Faturamento Mensal', value: '0 €' },
          { icon: <Clock size={24} className="text-orange-500" />, label: 'Tempo Médio', value: '1h20' },
        ];
      default:
        return [
          { icon: <Calendar size={24} className="text-blue-500" />, label: 'Compromissos', value: '0' },
          { icon: <Users size={24} className="text-green-500" />, label: 'Clientes', value: '0' },
          { icon: <LineChart size={24} className="text-purple-500" />, label: 'Faturamento', value: '0 €' },
          { icon: <Clock size={24} className="text-orange-500" />, label: 'Tempo Médio', value: '0 min' },
        ];
    }
  };

  // Obtém o ícone específico para o segmento
  const getSegmentIcon = () => {
    switch(company.segment) {
      case 'barbearia':
      case 'cabeleireiro':
        return <Scissors size={48} className="text-primary" />;
      case 'restaurante':
        return <Utensils size={48} className="text-primary" />;
      default:
        return <Settings size={48} className="text-primary" />;
    }
  };
  
  // Obtém o texto de CTA específico para o segmento
  const getSegmentCTA = () => {
    switch(company.segment) {
      case 'barbearia':
        return 'Adicione seu primeiro serviço de barbearia';
      case 'cabeleireiro':
        return 'Adicione seu primeiro serviço de salão';
      case 'restaurante':
        return 'Adicione seu primeiro item do cardápio';
      default:
        return 'Adicione seu primeiro serviço';
    }
  };

  const handleAddFirstItem = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Esta funcionalidade estará disponível em breve!",
    });
  };
  
  const metrics = getSegmentSpecificMetrics();
  
  return (
    <div className="p-6 space-y-8 animate-fade-in">
      <h2 className="text-2xl font-semibold">{getSegmentSpecificTitle()}</h2>
      
      {/* Estado vazio */}
      <Card className="p-10 text-center">
        <div className="flex flex-col items-center max-w-md mx-auto">
          <div className="bg-primary bg-opacity-10 p-4 rounded-full mb-6">
            {getSegmentIcon()}
          </div>
          <h3 className="text-xl font-semibold mb-2">Bem-vindo ao NexusHub</h3>
          <p className="text-gray-600 mb-6">
            Seu dashboard está pronto para uso. Comece adicionando seu primeiro item para ver métricas e dados relevantes.
          </p>
          <Button onClick={handleAddFirstItem}>
            <PlusCircle size={20} className="mr-2" />
            {getSegmentCTA()}
          </Button>
        </div>
      </Card>
      
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="flex items-center p-6">
            <div className="mr-4 p-3 bg-gray-100 rounded-full">
              {metric.icon}
            </div>
            <div>
              <p className="text-sm text-gray-600">{metric.label}</p>
              <p className="text-xl font-semibold">{metric.value}</p>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Próximos Passos */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Próximos Passos</h3>
          
          <ul className="space-y-3">
            <li className="flex items-center">
              <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center mr-3 flex-shrink-0">
                <span className="text-primary text-sm">1</span>
              </div>
              <span>Configure seu perfil</span>
            </li>
            <li className="flex items-center">
              <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center mr-3 flex-shrink-0">
                <span className="text-primary text-sm">2</span>
              </div>
              <span>
                {company.segment === 'restaurante' ? 'Adicione itens ao cardápio' : 'Adicione seus serviços'}
              </span>
            </li>
            <li className="flex items-center">
              <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center mr-3 flex-shrink-0">
                <span className="text-primary text-sm">3</span>
              </div>
              <span>
                {company.segment === 'restaurante' ? 'Comece a gerenciar reservas' : 'Comece a gerenciar clientes'}
              </span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default DashboardContent;
