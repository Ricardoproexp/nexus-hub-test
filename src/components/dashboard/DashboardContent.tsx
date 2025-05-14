
import React from 'react';
import { useCompany } from '@/context/CompanyContext';
import Card from '../common/Card';
import { Calendar, Users, LineChart, Clock } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { company } = useCompany();
  
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
          { icon: <Calendar size={24} className="text-blue-500" />, label: 'Agendamentos Hoje', value: '8' },
          { icon: <Users size={24} className="text-green-500" />, label: 'Clientes Ativos', value: '42' },
          { icon: <LineChart size={24} className="text-purple-500" />, label: 'Faturamento Mensal', value: 'R$ 3.250' },
          { icon: <Clock size={24} className="text-orange-500" />, label: 'Tempo Médio', value: '30 min' },
        ];
      case 'cabeleireiro':
        return [
          { icon: <Calendar size={24} className="text-blue-500" />, label: 'Agendamentos Hoje', value: '12' },
          { icon: <Users size={24} className="text-green-500" />, label: 'Clientes Ativos', value: '78' },
          { icon: <LineChart size={24} className="text-purple-500" />, label: 'Faturamento Mensal', value: 'R$ 5.680' },
          { icon: <Clock size={24} className="text-orange-500" />, label: 'Tempo Médio', value: '45 min' },
        ];
      case 'restaurante':
        return [
          { icon: <Calendar size={24} className="text-blue-500" />, label: 'Reservas Hoje', value: '15' },
          { icon: <Users size={24} className="text-green-500" />, label: 'Clientes Mês', value: '124' },
          { icon: <LineChart size={24} className="text-purple-500" />, label: 'Faturamento Mensal', value: 'R$ 12.450' },
          { icon: <Clock size={24} className="text-orange-500" />, label: 'Tempo Médio', value: '1h20' },
        ];
      default:
        return [
          { icon: <Calendar size={24} className="text-blue-500" />, label: 'Compromissos', value: '0' },
          { icon: <Users size={24} className="text-green-500" />, label: 'Clientes', value: '0' },
          { icon: <LineChart size={24} className="text-purple-500" />, label: 'Faturamento', value: 'R$ 0' },
          { icon: <Clock size={24} className="text-orange-500" />, label: 'Tempo Médio', value: '0 min' },
        ];
    }
  };
  
  const metrics = getSegmentSpecificMetrics();
  
  return (
    <div className="p-6 space-y-8 animate-fade-in">
      <h2 className="text-2xl font-semibold">{getSegmentSpecificTitle()}</h2>
      
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
      
      {/* Atividades Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Atividades Recentes</h3>
              
              <div className="space-y-4">
                {[1, 2, 3].map((_, index) => (
                  <div key={index} className="flex items-start pb-4 border-b last:border-b-0 last:pb-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 flex-shrink-0">
                      <Users size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">Novo cliente registrado</p>
                      <p className="text-sm text-gray-600">
                        {index === 0 ? 'Há 10 minutos' : index === 1 ? 'Há 3 horas' : 'Há 1 dia'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
        
        <div>
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
                  <span>Adicione seus serviços</span>
                </li>
                <li className="flex items-center">
                  <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-primary text-sm">3</span>
                  </div>
                  <span>Convide sua equipe</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
