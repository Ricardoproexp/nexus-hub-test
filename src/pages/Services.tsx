
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '@/context/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ServicesList from '@/components/services/ServicesList';
import ServiceForm from '@/components/services/ServiceForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';

const Services: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { company } = useCompany();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!company?.isAuthenticated) {
      navigate('/company/auth');
      return;
    }
    
    fetchServices();
  }, [company, navigate]);
  
  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', company.id)
        .order('name');
      
      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar serviços',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const handleAddService = () => {
    setEditingService(null);
    setShowForm(true);
  };
  
  const handleEditService = (service: any) => {
    setEditingService(service);
    setShowForm(true);
  };
  
  const handleDeleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Serviço excluído',
        description: 'O serviço foi excluído com sucesso.',
      });
      
      fetchServices();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir serviço',
        description: error.message,
        variant: 'destructive',
      });
    }
  };
  
  const handleServiceSaved = () => {
    setShowForm(false);
    fetchServices();
  };

  const getTitle = () => {
    switch(company.segment) {
      case 'restaurante': 
        return 'Itens do Cardápio';
      case 'barbearia':
      case 'cabeleireiro':
        return 'Serviços';
      default:
        return 'Produtos/Serviços';
    }
  };

  const getButtonLabel = () => {
    switch(company.segment) {
      case 'restaurante': 
        return 'Adicionar Item ao Cardápio';
      case 'barbearia':
      case 'cabeleireiro':
        return 'Adicionar Serviço';
      default:
        return 'Adicionar Produto/Serviço';
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold">{getTitle()}</h1>
              
              <Button onClick={handleAddService} className="bg-primary hover:bg-primary-hover">
                <PlusCircle size={16} className="mr-2" />
                {getButtonLabel()}
              </Button>
            </div>
            
            {showForm ? (
              <ServiceForm 
                service={editingService} 
                onSaved={handleServiceSaved} 
                onCancel={() => setShowForm(false)} 
              />
            ) : (
              <ServicesList 
                services={services} 
                isLoading={isLoading}
                onEdit={handleEditService}
                onDelete={handleDeleteService}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Services;
