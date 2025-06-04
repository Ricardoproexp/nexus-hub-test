
import React from 'react';
import { useCompany } from '@/context/CompanyContext';
import AvatarUpload from '@/components/common/AvatarUpload';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import Card from '@/components/common/Card';
import { useState } from 'react';

const Settings: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { company, updateAvatar } = useCompany();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-semibold mb-6">Configurações</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Settings */}
              <div className="lg:col-span-1">
                <Card className="p-6">
                  <h2 className="text-lg font-medium mb-4">Foto de Perfil</h2>
                  <div className="flex justify-center">
                    <AvatarUpload
                      currentAvatarUrl={company.avatarUrl}
                      onAvatarUpdate={(url) => updateAvatar(url)}
                      fallbackText={company.name ? company.name.charAt(0).toUpperCase() : 'U'}
                      size="lg"
                    />
                  </div>
                </Card>
              </div>
              
              {/* Company Information */}
              <div className="lg:col-span-2">
                <Card className="p-6">
                  <h2 className="text-lg font-medium mb-4">Informações da Empresa</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome da Empresa
                      </label>
                      <p className="text-gray-900">{company.name || 'Não informado'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CNPJ
                      </label>
                      <p className="text-gray-900">{company.cnpj || 'Não informado'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-mail
                      </label>
                      <p className="text-gray-900">{company.email || 'Não informado'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone
                      </label>
                      <p className="text-gray-900">{company.phone || 'Não informado'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Endereço
                      </label>
                      <p className="text-gray-900">{company.address || 'Não informado'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Segmento
                      </label>
                      <p className="text-gray-900">
                        {company.segment === 'barbearia' && 'Barbearia'}
                        {company.segment === 'cabeleireiro' && 'Cabeleireiro'}
                        {company.segment === 'restaurante' && 'Restaurante'}
                        {!company.segment && 'Não informado'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Plano de Assinatura
                      </label>
                      <p className="text-gray-900">
                        {company.subscriptionType === 'monthly' && 'Mensal'}
                        {company.subscriptionType === 'annual' && 'Anual'}
                        {!company.subscriptionType && 'Não informado'}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
