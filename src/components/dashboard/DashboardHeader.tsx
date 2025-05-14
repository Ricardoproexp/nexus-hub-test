
import React from 'react';
import { useCompany } from '@/context/CompanyContext';
import { Bell, Search } from 'lucide-react';

const DashboardHeader: React.FC = () => {
  const { company } = useCompany();
  
  // Obtenha o texto de saudação com base na hora do dia
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };
  
  return (
    <header className="bg-white border-b p-4 flex justify-between items-center">
      <div>
        <h1 className="text-xl font-medium">{getGreeting()}</h1>
        <p className="text-sm text-gray-600">
          {company.segment === 'barbearia' && 'Gerencie sua barbearia'}
          {company.segment === 'cabeleireiro' && 'Gerencie seu salão'}
          {company.segment === 'restaurante' && 'Gerencie seu restaurante'}
          {!company.segment && 'Bem-vindo ao dashboard'}
        </p>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative hidden md:block">
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-full text-sm"
          />
          <Search 
            size={16} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          />
        </div>
        
        <button 
          className="p-2 rounded-full hover:bg-gray-100 relative"
          aria-label="Notificações"
        >
          <Bell size={20} />
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
