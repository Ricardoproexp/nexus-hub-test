
import React, { createContext, useContext, useState } from 'react';

interface Company {
  name: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  segment: 'barbearia' | 'cabeleireiro' | 'restaurante' | null;
  subscriptionType: 'monthly' | 'annual' | null;
}

interface CompanyContextData {
  company: Company;
  updateCompany: (data: Partial<Company>) => void;
  isRegistrationComplete: boolean;
  setIsRegistrationComplete: (value: boolean) => void;
}

const defaultCompany: Company = {
  name: '',
  cnpj: '',
  address: '',
  phone: '',
  email: '',
  segment: null,
  subscriptionType: null,
};

const CompanyContext = createContext<CompanyContextData>({
  company: defaultCompany,
  updateCompany: () => {},
  isRegistrationComplete: false,
  setIsRegistrationComplete: () => {},
});

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [company, setCompany] = useState<Company>(defaultCompany);
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false);

  const updateCompany = (data: Partial<Company>) => {
    setCompany((prev) => ({ ...prev, ...data }));
  };

  return (
    <CompanyContext.Provider
      value={{
        company,
        updateCompany,
        isRegistrationComplete,
        setIsRegistrationComplete,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};
