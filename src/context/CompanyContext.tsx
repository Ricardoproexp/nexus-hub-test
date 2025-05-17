
import React, { createContext, useContext, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';

type CompanyRow = Database['public']['Tables']['companies']['Row'];

interface Company {
  name: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  password: string;
  segment: 'barbearia' | 'cabeleireiro' | 'restaurante' | null;
  subscriptionType: 'monthly' | 'annual' | null;
  isAuthenticated?: boolean;
  id?: string;
}

interface CompanyContextData {
  company: Company;
  updateCompany: (data: Partial<Company>) => void;
  isRegistrationComplete: boolean;
  setIsRegistrationComplete: (value: boolean) => void;
  loginCompany: (email: string, password: string) => Promise<boolean>;
  logoutCompany: () => void;
  registerCompany: () => Promise<boolean>;
}

const defaultCompany: Company = {
  name: '',
  cnpj: '',
  address: '',
  phone: '',
  email: '',
  password: '',
  segment: null,
  subscriptionType: null,
  isAuthenticated: false,
};

const CompanyContext = createContext<CompanyContextData>({
  company: defaultCompany,
  updateCompany: () => {},
  isRegistrationComplete: false,
  setIsRegistrationComplete: () => {},
  loginCompany: () => Promise.resolve(false),
  logoutCompany: () => {},
  registerCompany: () => Promise.resolve(false),
});

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [company, setCompany] = useState<Company>(defaultCompany);
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false);
  const navigate = useNavigate();

  const updateCompany = (data: Partial<Company>) => {
    setCompany((prev) => ({ ...prev, ...data }));
  };

  const registerCompany = async (): Promise<boolean> => {
    try {
      // 1. Register the user with auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: company.email,
        password: company.password,
      });

      if (authError || !authData.user) {
        toast({
          title: "Erro no registro",
          description: authError?.message || "Não foi possível criar a conta",
          variant: "destructive"
        });
        return false;
      }

      // 2. Create the company profile
      const { error: companyError } = await supabase
        .from('companies')
        .insert({
          user_id: authData.user.id,
          name: company.name,
          cnpj: company.cnpj,
          address: company.address,
          phone: company.phone,
          email: company.email,
          segment: company.segment || null,
          subscription_type: company.subscriptionType || null,
        });

      if (companyError) {
        toast({
          title: "Erro ao salvar dados",
          description: companyError.message,
          variant: "destructive"
        });
        return false;
      }

      // Update company data with authenticated status
      updateCompany({ isAuthenticated: true });
      
      toast({
        title: "Registro concluído",
        description: "Sua empresa foi cadastrada com sucesso!",
      });
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Erro no registro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    }
  };

  const loginCompany = async (email: string, password: string): Promise<boolean> => {
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
        return false;
      }

      // 2. Get company data
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (companyError || !companyData) {
        toast({
          title: "Erro ao buscar dados",
          description: "Não foi possível recuperar os dados da empresa",
          variant: "destructive"
        });
        return false;
      }

      // 3. Update company state with fetched data
      setCompany({
        id: companyData.id,
        name: companyData.name,
        cnpj: companyData.cnpj,
        address: companyData.address,
        phone: companyData.phone,
        email: companyData.email,
        password: '',
        segment: companyData.segment as any,
        subscriptionType: companyData.subscription_type as any,
        isAuthenticated: true
      });

      toast({
        title: "Login realizado",
        description: "Bem-vindo de volta!",
      });
      
      navigate('/dashboard');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    }
  };

  const logoutCompany = async () => {
    try {
      await supabase.auth.signOut();
      setCompany(defaultCompany);
      navigate('/company/auth');
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
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
    <CompanyContext.Provider
      value={{
        company,
        updateCompany,
        isRegistrationComplete,
        setIsRegistrationComplete,
        loginCompany,
        logoutCompany,
        registerCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};
