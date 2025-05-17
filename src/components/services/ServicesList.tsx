
import React from 'react';
import { useCompany } from '@/context/CompanyContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Utensils, Scissors, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ServicesListProps {
  services: any[];
  isLoading: boolean;
  onEdit: (service: any) => void;
  onDelete: (id: string) => void;
}

const ServicesList: React.FC<ServicesListProps> = ({ 
  services, 
  isLoading,
  onEdit,
  onDelete
}) => {
  const { company } = useCompany();
  const { toast } = useToast();

  const getIcon = () => {
    switch(company.segment) {
      case 'restaurante':
        return Utensils;
      case 'barbearia':
      case 'cabeleireiro':
        return Scissors;
      default:
        return Package;
    }
  };

  const Icon = getIcon();

  const getEmptyMessage = () => {
    switch(company.segment) {
      case 'restaurante':
        return 'Nenhum item adicionado ao cardápio ainda. Comece adicionando seu primeiro item.';
      case 'barbearia':
      case 'cabeleireiro':
        return 'Nenhum serviço cadastrado ainda. Comece adicionando seu primeiro serviço.';
      default:
        return 'Nenhum produto ou serviço cadastrado ainda.';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getHeaderTitle = () => {
    switch(company.segment) {
      case 'restaurante':
        return 'Item';
      default:
        return 'Serviço';
    }
  };
  
  if (isLoading) {
    return (
      <Card className="p-6 text-center">
        <p>Carregando...</p>
      </Card>
    );
  }
  
  if (services.length === 0) {
    return (
      <Card className="p-10 text-center">
        <div className="flex flex-col items-center">
          <div className="bg-primary bg-opacity-10 p-4 rounded-full mb-6">
            <Icon size={48} className="text-primary" />
          </div>
          <h3 className="text-xl font-medium mb-2">Nenhum item encontrado</h3>
          <p className="text-gray-600 mb-6">
            {getEmptyMessage()}
          </p>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {getHeaderTitle()}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Preço
            </th>
            {(company.segment !== 'restaurante') && (
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duração
              </th>
            )}
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {services.map((service) => (
            <tr key={service.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-gray-900">{service.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {formatPrice(service.price)}
              </td>
              {(company.segment !== 'restaurante') && (
                <td className="px-6 py-4 whitespace-nowrap">
                  {service.duration} min
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onEdit(service)}
                  >
                    <Edit2 size={16} className="text-blue-500" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir "{service.name}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-500 hover:bg-red-600"
                          onClick={() => onDelete(service.id)}
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ServicesList;
