
import React, { useState } from 'react';
import { useCompany } from '@/context/CompanyContext';
import { Bell, Search, X } from 'lucide-react';

const DashboardHeader: React.FC = () => {
  const { company } = useCompany();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(true);
  
  // Obtenha o texto de saudação com base na hora do dia
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const handleNotificationClick = () => {
    setNotificationOpen(!notificationOpen);
    if (hasNotifications) {
      setHasNotifications(false); // Remove o ponto vermelho quando abrir
    }
  };
  
  return (
    <header className="bg-white border-b p-4 flex justify-between items-center">
      <div className="flex items-center space-x-3">
        {company.avatarUrl && (
          <div className="w-12 h-12 rounded-full bg-black p-1">
            <img 
              src={company.avatarUrl} 
              alt={`Logo da ${company.name}`}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        )}
        <div>
          <h1 className="text-xl font-medium">{company.name || 'Sua Empresa'}</h1>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 relative">
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
        
        <div className="relative">
          <button 
            onClick={handleNotificationClick}
            className="p-2 rounded-full hover:bg-gray-100 relative"
            aria-label="Notificações"
          >
            <Bell size={20} />
            {hasNotifications && (
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          
          {/* Dropdown de Notificações */}
          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-medium">Notificações</h3>
                <button 
                  onClick={() => setNotificationOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="p-4">
                <div className="text-sm text-gray-600 mb-3">
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Bell size={16} className="text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Bem-vindo!</p>
                      <p className="text-blue-700 text-sm">
                        Configure seu perfil e adicione seus serviços para começar a receber agendamentos.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Futuras notificações aparecerão aqui */}
                <div className="text-center text-gray-500 text-sm py-4">
                  Nenhuma nova notificação
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
