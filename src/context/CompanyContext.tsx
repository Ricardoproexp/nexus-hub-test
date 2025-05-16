
import React, { createContext, useContext, useState } from 'react';

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
}

interface CompanyContextData {
  company: Company;
  updateCompany: (data: Partial<Company>) => void;
  isRegistrationComplete: boolean;
  setIsRegistrationComplete: (value: boolean) => void;
  loginCompany: (email: string, password: string) => Promise<boolean>;
  logoutCompany: () => void;
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

// Mock companies database for demo purposes
const mockCompanies = [
  {
    name: 'Empresa Demo',
    email: 'empresa@example.com',
    password: '123456',
    cnpj: '12.345.678/0001-00',
    phone: '+55 11 1234-5678',
    address: 'Rua Exemplo, 123',
    segment: 'barbearia' as const,
    subscriptionType: 'monthly' as const,
  },
];

const CompanyContext = createContext<CompanyContextData>({
  company: defaultCompany,
  updateCompany: () => {},
  isRegistrationComplete: false,
  setIsRegistrationComplete: () => {},
  loginCompany: () => Promise.resolve(false),
  logoutCompany: () => {},
});

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [company, setCompany] = useState<Company>(defaultCompany);
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false);
  const [companies, setCompanies] = useState(mockCompanies);

  const updateCompany = (data: Partial<Company>) => {
    setCompany((prev) => ({ ...prev, ...data }));
  };

  const loginCompany = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const foundCompany = companies.find(c => c.email === email && c.password === password);
        
        if (foundCompany) {
          setCompany({ ...foundCompany, isAuthenticated: true });
          resolve(true);
        } else {
          resolve(false);
        }
      }, 1000);
    });
  };

  const logoutCompany = () => {
    setCompany(defaultCompany);
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
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};
