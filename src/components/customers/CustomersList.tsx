
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Users } from 'lucide-react';
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

interface CustomersListProps {
  customers: any[];
  isLoading: boolean;
  onEdit: (customer: any) => void;
  onDelete: (id: string) => void;
}

const CustomersList: React.FC<CustomersListProps> = ({ 
  customers, 
  isLoading,
  onEdit,
  onDelete
}) => {
  const { toast } = useToast();
  
  if (isLoading) {
    return (
      <Card className="p-6 text-center">
        <p>Carregando...</p>
      </Card>
    );
  }
  
  if (customers.length === 0) {
    return (
      <Card className="p-10 text-center">
        <div className="flex flex-col items-center">
          <div className="bg-primary bg-opacity-10 p-4 rounded-full mb-6">
            <Users size={48} className="text-primary" />
          </div>
          <h3 className="text-xl font-medium mb-2">Nenhum cliente encontrado</h3>
          <p className="text-gray-600 mb-6">
            Você ainda não possui clientes cadastrados. Comece adicionando seu primeiro cliente.
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
              Nome
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Telefone
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-gray-900">{customer.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {customer.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {customer.phone}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onEdit(customer)}
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
                          Tem certeza que deseja excluir o cliente "{customer.name}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-500 hover:bg-red-600"
                          onClick={() => onDelete(customer.id)}
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

export default CustomersList;
