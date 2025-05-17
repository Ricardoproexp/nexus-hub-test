import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '@/context/CompanyContext';
import Card from '../common/Card';
import Button from '../common/Button';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Users, LineChart, Clock, PlusCircle, Settings, Scissors, Utensils } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DashboardContent: React.FC = () => {
  const { company } = useCompany();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    appointments: 0,
    customers: 0,
    services: 0,
    revenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (company?.id) {
      fetchDashboardStats();
    }
  }, [company]);
  
  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      
      // Buscar total de serviços
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id', { count: 'exact' })
        .eq('company_id', company.id);
      
      if (servicesError) throw servicesError;
      
      // Buscar total de agendamentos
      const { count: appointmentsCount, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company.id);
      
      if (appointmentsError) throw appointmentsError;
      
      // Buscar receita total (soma dos valores dos agendamentos)
      const { data: revenueData, error: revenueError } = await supabase
        .from('appointments')
        .select('service_price')
        .eq('company_id', company.id);
      
      if (revenueError) throw revenueError;
      
      const totalRevenue = revenueData?.reduce((acc, curr) => acc + (curr.service_price || 0), 0) || 0;
      
      // Buscar total aproximado de clientes únicos
      const { data: customers, error: customersError } = await supabase
        .from('appointments')
        .select('customer_id', { count: 'exact', head: true })
        .eq('company_id', company.id);
      
      if (customersError) throw customersError;
      
      setStats({
        appointments: appointmentsCount || 0,
        customers: customers?.length || 0,
        services: services?.length || 0,
        revenue: totalRevenue
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    const formatRevenue = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'EUR'
      }).format(value);
    };
    
    switch(company.segment) {
      case 'barbearia':
        return [
          { icon: <Calendar size={24} className="text-blue-500" />, label: 'Agendamentos', value: stats.appointments.toString() },
          { icon: <Users size={24} className="text-green-500" />, label: 'Clientes Atendidos', value: stats.customers.toString() },
          { icon: <LineChart size={24} className="text-purple-500" />, label: 'Faturamento Total', value: formatRevenue(stats.revenue) },
          { icon: <Scissors size={24} className="text-orange-500" />, label: 'Serviços Disponíveis', value: stats.services.toString() },
        ];
      case 'cabeleireiro':
        return [
          { icon: <Calendar size={24} className="text-blue-500" />, label: 'Agendamentos', value: stats.appointments.toString() },
          { icon: <Users size={24} className="text-green-500" />, label: 'Clientes Atendidos', value: stats.customers.toString() },
          { icon: <LineChart size={24} className="text-purple-500" />, label: 'Faturamento Total', value: formatRevenue(stats.revenue) },
          { icon: <Scissors size={24} className="text-orange-500" />, label: 'Serviços Disponíveis', value: stats.services.toString() },
        ];
      case 'restaurante':
        return [
          { icon: <Calendar size={24} className="text-blue-500" />, label: 'Reservas', value: stats.appointments.toString() },
          { icon: <Users size={24} className="text-green-500" />, label: 'Clientes Atendidos', value: stats.customers.toString() },
          { icon: <LineChart size={24} className="text-purple-500" />, label: 'Faturamento Total', value: formatRevenue(stats.revenue) },
          { icon: <Utensils size={24} className="text-orange-500" />, label: 'Itens no Cardápio', value: stats.services.toString() },
        ];
      default:
        return [
          { icon: <Calendar size={24} className="text-blue-500" />, label: 'Compromissos', value: stats.appointments.toString() },
          { icon: <Users size={24} className="text-green-500" />, label: 'Clientes', value: stats.customers.toString() },
          { icon: <LineChart size={24} className="text-purple-500" />, label: 'Faturamento', value: formatRevenue(stats.revenue) },
          { icon: <Settings size={24} className="text-orange-500" />, label: 'Produtos/Serviços', value: stats.services.toString() },
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
        return 'Adicionar primeiro serviço de barbearia';
      case 'cabeleireiro':
        return 'Adicionar primeiro serviço de salão';
      case 'restaurante':
        return 'Adicionar primeiro item do cardápio';
      default:
        return 'Adicionar primeiro serviço';
    }
  };

  const handleAddFirstItem = () => {
    navigate('/services');
  };
  
  const metrics = getSegmentSpecificMetrics();
  
  const showEmptyState = stats.services === 0;
  
  return (
    <div className="p-6 space-y-8 animate-fade-in">
      <h2 className="text-2xl font-semibold">{getSegmentSpecificTitle()}</h2>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-24 animate-pulse bg-gray-100">
              {/* Adding empty div as children to fix the error */}
              <div></div>
            </Card>
          ))}
        </div>
      ) : showEmptyState ? (
        // Estado vazio
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
      ) : (
        <>
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
          
          {/* Ações Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/appointments')} 
                  variant="outline" 
                  fullWidth
                >
                  <Calendar size={18} className="mr-2" />
                  {company.segment === 'restaurante' ? 'Nova Reserva' : 'Novo Agendamento'}
                </Button>
                <Button 
                  onClick={() => navigate('/customers')} 
                  variant="outline" 
                  fullWidth
                >
                  <Users size={18} className="mr-2" />
                  Adicionar Cliente
                </Button>
                <Button 
                  onClick={() => navigate('/services')} 
                  variant="outline" 
                  fullWidth
                >
                  {company.segment === 'restaurante' ? 
                    <><Utensils size={18} className="mr-2" />Adicionar Item ao Cardápio</> : 
                    <><Scissors size={18} className="mr-2" />Adicionar Serviço</>
                  }
                </Button>
              </div>
            </Card>
            
            {/* Próximos Agendamentos/Reservas */}
            <Card className="p-6 col-span-1 md:col-span-2 border-l-4 border-green-500">
              <h3 className="text-lg font-semibold mb-4">
                {company.segment === 'restaurante' ? 'Próximas Reservas' : 'Próximos Agendamentos'}
              </h3>
              {stats.appointments === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    Nenhum {company.segment === 'restaurante' ? 'reserva' : 'agendamento'} encontrado
                  </p>
                  <Button 
                    onClick={() => navigate('/appointments')} 
                    variant="secondary"
                  >
                    <Calendar size={18} className="mr-2" />
                    {company.segment === 'restaurante' ? 'Criar Reserva' : 'Criar Agendamento'}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Button 
                    onClick={() => navigate('/appointments')} 
                  >
                    <Calendar size={18} className="mr-2" />
                    Ver {company.segment === 'restaurante' ? 'Reservas' : 'Agendamentos'}
                  </Button>
                </div>
              )}
            </Card>
          </div>
          
          {/* Próximos Passos */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Próximos Passos</h3>
            
            <ul className="space-y-3">
              <li className="flex items-center">
                <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-primary text-sm">1</span>
                </div>
                <span>Complete seu perfil em Configurações</span>
              </li>
              <li className="flex items-center">
                <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-primary text-sm">2</span>
                </div>
                <span>
                  {company.segment === 'restaurante' 
                    ? 'Adicione mais itens ao cardápio' 
                    : 'Adicione mais serviços'}
                </span>
              </li>
              <li className="flex items-center">
                <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-primary text-sm">3</span>
                </div>
                <span>
                  {company.segment === 'restaurante' 
                    ? 'Comece a registrar reservas' 
                    : 'Comece a registrar agendamentos'}
                </span>
              </li>
            </ul>
          </Card>
        </>
      )}
    </div>
  );
};

export default DashboardContent;
