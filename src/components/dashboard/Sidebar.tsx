import React from 'react';
import { useCompany } from '@/context/CompanyContext';
import Logo from '../common/Logo';
import AvatarUpload from '../common/AvatarUpload';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Users, Package, LineChart, Settings, Menu, X, Clipboard, Utensils, Scissors, ShoppingBag, Store } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { company, logoutCompany, updateAvatar } = useCompany();
  const location = useLocation();

  // Função para verificar se o link está ativo
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Menu items baseados no segmento selecionado
  const getSegmentSpecificItems = () => {
    switch (company.segment) {
      case 'barbearia':
        return [
          { icon: <Calendar size={20} />, label: 'Agendamentos', path: '/appointments' },
          { icon: <Scissors size={20} />, label: 'Serviços', path: '/services' },
          { icon: <Users size={20} />, label: 'Clientes', path: '/customers' },
        ];
      case 'cabeleireiro':
        return [
          { icon: <Calendar size={20} />, label: 'Agendamentos', path: '/appointments' },
          { icon: <Scissors size={20} />, label: 'Serviços', path: '/services' },
          { icon: <Users size={20} />, label: 'Clientes', path: '/customers' },
        ];
      case 'restaurante':
        return [
          { icon: <Calendar size={20} />, label: 'Reservas', path: '/appointments' },
          { icon: <Utensils size={20} />, label: 'Cardápio', path: '/services' },
          { icon: <Users size={20} />, label: 'Clientes', path: '/customers' },
        ];
      default:
        return [
          { icon: <Calendar size={20} />, label: 'Agenda', path: '/appointments' },
          { icon: <Package size={20} />, label: 'Serviços/Produtos', path: '/services' },
          { icon: <Users size={20} />, label: 'Clientes', path: '/customers' },
        ];
    }
  };

  // Menu items comuns
  const commonItems = [
    { icon: <Home size={20} />, label: 'Dashboard', path: '/dashboard' },
    ...getSegmentSpecificItems(),
    { icon: <ShoppingBag size={20} />, label: 'Produtos da Loja', path: '/products' },
    { icon: <Clipboard size={20} />, label: 'Encomendas', path: '/orders' },
    { icon: <LineChart size={20} />, label: 'Financeiro & Stock', path: '/reports' },
    { icon: <Settings size={20} />, label: 'Definições da Loja', path: '/store-settings' },
    ...(company.id ? [{ icon: <Store size={20} />, label: 'Ver a minha loja', path: `/loja/${company.id}` }] : []),
  ];

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={toggleSidebar}
        />
      )}
    
      {/* Sidebar */}
      <aside 
        className={`fixed md:static h-full bg-sidebar text-sidebar-foreground z-30 transition-all duration-300 ${
          isOpen ? 'left-0' : '-left-64'
        } w-64 flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <Logo />
          <button 
            className="md:hidden text-white"
            onClick={toggleSidebar}
            aria-label="Fechar menu"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-sm opacity-80 mb-2">Empresa</p>
          <p className="font-medium truncate">{company.name || 'Minha Empresa'}</p>
        </div>
        
        <nav className="flex-grow p-2">
          <ul className="space-y-1">
            {commonItems.map((item, index) => (
              <li key={index}>
                <Link 
                  to={item.path} 
                  className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                    isActive(item.path) 
                      ? 'bg-sidebar-accent text-white' 
                      : 'hover:bg-sidebar-accent/50'
                  }`}
                  onClick={isOpen ? toggleSidebar : undefined}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 mt-auto border-t border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-3">
                <AvatarUpload
                  currentAvatarUrl={company.avatarUrl}
                  onAvatarUpdate={(url) => updateAvatar(url)}
                  fallbackText={company.name ? company.name.charAt(0).toUpperCase() : 'U'}
                  size="sm"
                />
              </div>
              <div className="truncate">
                <p className="text-sm font-medium truncate">{company.name || 'Usuário'}</p>
                <p className="text-xs opacity-80 truncate">{company.email || 'email@exemplo.com'}</p>
              </div>
            </div>
            
            <button
              onClick={logoutCompany}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Sair
            </button>
          </div>
        </div>
      </aside>
      
      {/* Toggle button */}
      <button
        className="fixed md:hidden bottom-4 right-4 bg-primary text-white p-3 rounded-full shadow-lg z-10"
        onClick={toggleSidebar}
        aria-label="Abrir menu"
      >
        <Menu size={24} />
      </button>
    </>
  );
};

export default Sidebar;
