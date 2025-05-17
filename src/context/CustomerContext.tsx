
import React, { createContext, useContext, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';

type CustomerRow = Database['public']['Tables']['customers']['Row'];

interface Customer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  isAuthenticated: boolean;
}

interface CustomerContextData {
  customer: Customer | null;
  loginCustomer: (email: string, password: string) => Promise<boolean>;
  registerCustomer: (name: string, email: string, password: string, phone: string) => Promise<boolean>;
  logoutCustomer: () => void;
  isLoading: boolean;
}

const defaultCustomer: Customer = {
  id: '',
  name: '',
  email: '',
  phone: '',
  isAuthenticated: false,
};

const CustomerContext = createContext<CustomerContextData>({
  customer: null,
  loginCustomer: () => Promise.resolve(false),
  registerCustomer: () => Promise.resolve(false),
  logoutCustomer: () => {},
  isLoading: false,
});

export const useCustomer = () => useContext(CustomerContext);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const registerCustomer = async (name: string, email: string, password: string, phone: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // 1. Register the user with auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError || !authData.user) {
        toast({
          title: "Erro no registro",
          description: authError?.message || "Não foi possível criar a conta",
          variant: "destructive"
        });
        setIsLoading(false);
        return false;
      }

      // 2. Create the customer profile
      const { error: customerError } = await supabase
        .from('customers')
        .insert({
          user_id: authData.user.id,
          name,
          email,
          phone,
        });

      if (customerError) {
        toast({
          title: "Erro ao salvar dados",
          description: customerError.message,
          variant: "destructive"
        });
        setIsLoading(false);
        return false;
      }

      // Get the newly created customer data with ID
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      // Set the customer state
      if (customerData) {
        setCustomer({
          id: customerData.id,
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address || undefined,
          isAuthenticated: true,
        });
      }

      toast({
        title: "Registro concluído",
        description: "Sua conta foi criada com sucesso!",
      });
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Erro no registro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      setIsLoading(false);
      return false;
    }
  };

  const loginCustomer = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // 1. Authenticate user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        toast({
          title: "Erro no login",
          description: "Email ou senha incorretos",
          variant: "destructive"
        });
        setIsLoading(false);
        return false;
      }

      // 2. Get customer data
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (customerError || !customerData) {
        toast({
          title: "Erro ao buscar dados",
          description: "Não foi possível recuperar os dados do cliente",
          variant: "destructive"
        });
        setIsLoading(false);
        return false;
      }

      // 3. Update customer state with fetched data
      setCustomer({
        id: customerData.id,
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address || undefined,
        isAuthenticated: true,
      });

      toast({
        title: "Login realizado",
        description: "Bem-vindo de volta!",
      });
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      setIsLoading(false);
      return false;
    }
  };

  const logoutCustomer = async () => {
    try {
      await supabase.auth.signOut();
      setCustomer(null);
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
      
      navigate('/customer/auth');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    }
  };

  return (
    <CustomerContext.Provider
      value={{
        customer,
        loginCustomer,
        registerCustomer,
        logoutCustomer,
        isLoading,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};
