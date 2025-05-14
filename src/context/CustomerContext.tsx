
import React, { createContext, useContext, useState } from 'react';

interface Customer {
  id: string;
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

// Mock customers database for demo purposes
const mockCustomers = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@example.com',
    password: '123456',
    phone: '+55 11 98765-4321',
    isAuthenticated: false,
  },
];

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
  const [customers, setCustomers] = useState(mockCustomers);

  const loginCustomer = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const foundCustomer = customers.find(c => c.email === email && c.password === password);
        
        if (foundCustomer) {
          const { password, ...customerData } = foundCustomer;
          setCustomer({ ...customerData, isAuthenticated: true });
          resolve(true);
        } else {
          resolve(false);
        }
        
        setIsLoading(false);
      }, 1000);
    });
  };

  const registerCustomer = async (name: string, email: string, password: string, phone: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const emailExists = customers.some(c => c.email === email);
        
        if (emailExists) {
          resolve(false);
        } else {
          const newCustomer = {
            id: String(customers.length + 1),
            name,
            email,
            password,
            phone,
            isAuthenticated: true,
          };
          
          setCustomers([...customers, newCustomer]);
          const { password: _, ...customerData } = newCustomer;
          setCustomer({ ...customerData, isAuthenticated: true });
          resolve(true);
        }
        
        setIsLoading(false);
      }, 1000);
    });
  };

  const logoutCustomer = () => {
    setCustomer(null);
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
