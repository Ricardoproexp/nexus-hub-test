
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '@/context/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import CustomersList from '@/components/customers/CustomersList';
import CustomerForm from '@/components/customers/CustomerForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';

const Customers: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { company } = useCompany();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!company?.isAuthenticated) {
      navigate('/company/auth');
      return;
    }
    
    fetchCustomers();
  }, [company, navigate]);
  
  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      
      // Simulando fetch de clientes (na implementação real, você precisaria adicionar uma tabela company_customers)
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar clientes',
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
  
  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };
  
  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };
  
  const handleDeleteCustomer = async (id: string) => {
    try {
      // Na implementação real, você precisaria adicionar uma tabela company_customers
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Cliente excluído',
        description: 'O cliente foi excluído com sucesso.',
      });
      
      fetchCustomers();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir cliente',
        description: error.message,
        variant: 'destructive',
      });
    }
  };
  
  const handleCustomerSaved = () => {
    setShowForm(false);
    fetchCustomers();
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold">Clientes</h1>
              
              <Button onClick={handleAddCustomer} className="bg-primary hover:bg-primary-hover">
                <PlusCircle size={16} className="mr-2" />
                Adicionar Cliente
              </Button>
            </div>
            
            {showForm ? (
              <CustomerForm 
                customer={editingCustomer} 
                onSaved={handleCustomerSaved} 
                onCancel={() => setShowForm(false)} 
              />
            ) : (
              <CustomersList 
                customers={customers} 
                isLoading={isLoading}
                onEdit={handleEditCustomer}
                onDelete={handleDeleteCustomer}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Customers;
