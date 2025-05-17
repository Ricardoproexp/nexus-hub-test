
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '@/context/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import AppointmentsList from '@/components/appointments/AppointmentsList';
import AppointmentForm from '@/components/appointments/AppointmentForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';

const Appointments: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { company } = useCompany();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!company?.isAuthenticated) {
      navigate('/company/auth');
      return;
    }
    
    fetchAppointments();
  }, [company, navigate]);
  
  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      
      // Buscar agendamentos da empresa atual
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          customers:customer_id (name, email, phone)
        `)
        .eq('company_id', company.id)
        .order('appointment_date', { ascending: true });
      
      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar agendamentos',
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
  
  const handleAddAppointment = () => {
    setEditingAppointment(null);
    setShowForm(true);
  };
  
  const handleEditAppointment = (appointment: any) => {
    setEditingAppointment(appointment);
    setShowForm(true);
  };
  
  const handleDeleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: getPageTitle(false) + ' cancelado',
        description: getPageTitle(false) + ' foi cancelado com sucesso.',
      });
      
      fetchAppointments();
    } catch (error: any) {
      toast({
        title: 'Erro ao cancelar ' + getPageTitle(false).toLowerCase(),
        description: error.message,
        variant: 'destructive',
      });
    }
  };
  
  const handleAppointmentSaved = () => {
    setShowForm(false);
    fetchAppointments();
  };

  // Obtém os títulos de acordo com o segmento da empresa
  const getPageTitle = (plural: boolean = true) => {
    switch(company.segment) {
      case 'restaurante': 
        return plural ? 'Reservas' : 'Reserva';
      case 'barbearia':
      case 'cabeleireiro':
        return plural ? 'Agendamentos' : 'Agendamento';
      default:
        return plural ? 'Compromissos' : 'Compromisso';
    }
  };

  const getButtonLabel = () => {
    switch(company.segment) {
      case 'restaurante': 
        return 'Nova Reserva';
      case 'barbearia':
      case 'cabeleireiro':
        return 'Novo Agendamento';
      default:
        return 'Novo Compromisso';
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
              <h1 className="text-2xl font-semibold">{getPageTitle()}</h1>
              
              <Button onClick={handleAddAppointment} className="bg-primary hover:bg-primary-hover">
                <PlusCircle size={16} className="mr-2" />
                {getButtonLabel()}
              </Button>
            </div>
            
            {showForm ? (
              <AppointmentForm 
                appointment={editingAppointment} 
                onSaved={handleAppointmentSaved} 
                onCancel={() => setShowForm(false)} 
              />
            ) : (
              <AppointmentsList 
                appointments={appointments} 
                isLoading={isLoading}
                onEdit={handleEditAppointment}
                onDelete={handleDeleteAppointment}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Appointments;
