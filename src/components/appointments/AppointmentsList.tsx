
import React from 'react';
import { useCompany } from '@/context/CompanyContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
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

interface AppointmentsListProps {
  appointments: any[];
  isLoading: boolean;
  onEdit: (appointment: any) => void;
  onDelete: (id: string) => void;
}

const AppointmentsList: React.FC<AppointmentsListProps> = ({ 
  appointments, 
  isLoading,
  onEdit,
  onDelete
}) => {
  const { company } = useCompany();

  // Formatação de data/hora
  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: pt });
  };

  const formatTime = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, "HH:mm", { locale: pt });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price || 0);
  };

  // Obtém os textos específicos para cada segmento
  const getItemName = () => {
    switch(company.segment) {
      case 'restaurante': 
        return 'Reserva';
      case 'barbearia':
      case 'cabeleireiro':
        return 'Agendamento';
      default:
        return 'Compromisso';
    }
  };

  const getServiceLabel = () => {
    switch(company.segment) {
      case 'restaurante': 
        return 'Tipo de Mesa';
      default:
        return 'Serviço';
    }
  };

  const getEmptyMessage = () => {
    switch(company.segment) {
      case 'restaurante': 
        return 'Nenhuma reserva encontrada. Comece adicionando sua primeira reserva.';
      case 'barbearia':
      case 'cabeleireiro':
        return 'Nenhum agendamento encontrado. Comece adicionando seu primeiro agendamento.';
      default:
        return 'Nenhum compromisso encontrado. Comece adicionando seu primeiro compromisso.';
    }
  };
  
  if (isLoading) {
    return (
      <Card className="p-6 text-center">
        <p>Carregando...</p>
      </Card>
    );
  }
  
  if (appointments.length === 0) {
    return (
      <Card className="p-10 text-center">
        <div className="flex flex-col items-center">
          <div className="bg-primary bg-opacity-10 p-4 rounded-full mb-6">
            <Calendar size={48} className="text-primary" />
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
    <div className="space-y-6">
      {appointments.map((appointment) => (
        <Card key={appointment.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="flex-grow">
              <div className="flex items-center mb-3">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                <span className="font-medium">{formatDate(appointment.appointment_date)}</span>
                <div className="bg-gray-300 h-4 w-px mx-2" />
                <Clock className="h-5 w-5 mr-2 text-primary" />
                <span>{formatTime(appointment.appointment_date)}</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-medium">{appointment.customers?.name}</p>
                  <p className="text-sm">{appointment.customers?.phone}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">{getServiceLabel()}</p>
                  <p className="font-medium">{appointment.service_name}</p>
                  <div className="flex items-center">
                    {appointment.service_price > 0 && (
                      <p className="text-sm mr-3">{formatPrice(appointment.service_price)}</p>
                    )}
                    <p className="text-sm text-gray-600">{appointment.service_duration} min</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex mt-4 md:mt-0 ml-0 md:ml-4 space-x-2 self-start md:self-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(appointment)}
              >
                <Edit2 size={16} className="mr-2" />
                Editar
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-red-200 text-red-500 hover:bg-red-50">
                    <Trash2 size={16} className="mr-2" />
                    Cancelar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar cancelamento</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja cancelar este {getItemName().toLowerCase()}? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-500 hover:bg-red-600"
                      onClick={() => onDelete(appointment.id)}
                    >
                      Cancelar {getItemName()}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default AppointmentsList;
