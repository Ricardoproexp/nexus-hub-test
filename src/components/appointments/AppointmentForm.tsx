
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCompany } from '@/context/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { CalendarIcon, Clock } from 'lucide-react';

interface AppointmentFormProps {
  appointment?: any;
  onSaved: () => void;
  onCancel: () => void;
}

// Schema para validação do formulário
const formSchema = z.object({
  customer_id: z.string().min(1, 'Cliente é obrigatório'),
  service_id: z.string().min(1, 'Serviço é obrigatório'),
  date: z.date({ required_error: 'Data é obrigatória' }),
  time: z.string().min(1, 'Horário é obrigatório'),
});

const AppointmentForm: React.FC<AppointmentFormProps> = ({ appointment, onSaved, onCancel }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  
  const { company } = useCompany();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: appointment?.customer_id || '',
      service_id: '',
      date: appointment ? new Date(appointment.appointment_date) : new Date(),
      time: appointment ? format(new Date(appointment.appointment_date), 'HH:mm') : '09:00',
    },
  });
  
  // Carregar clientes e serviços disponíveis
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Carregar clientes
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('*')
          .order('name');
        
        if (customersError) throw customersError;
        setCustomers(customersData || []);
        
        // Carregar serviços da empresa atual
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('company_id', company.id)
          .order('name');
        
        if (servicesError) throw servicesError;
        setServices(servicesData || []);
        
        // Se estiver editando, pré-selecionar o serviço
        if (appointment?.service_name) {
          const service = servicesData?.find(s => s.name === appointment.service_name);
          if (service) {
            form.setValue('service_id', service.id);
            setSelectedService(service);
          }
        }
      } catch (error: any) {
        toast({
          title: 'Erro ao carregar dados',
          description: error.message,
          variant: 'destructive',
        });
      }
    };
    
    fetchData();
  }, [company.id, appointment, form, toast]);
  
  // Ao selecionar um serviço
  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    setSelectedService(service);
  };
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!company.id) {
        throw new Error('Empresa não identificada');
      }
      
      if (!selectedService) {
        throw new Error('Serviço não selecionado');
      }
      
      // Combinar data e hora para criar timestamp
      const [hours, minutes] = values.time.split(':').map(Number);
      const appointmentDate = new Date(values.date);
      appointmentDate.setHours(hours, minutes, 0, 0);
      
      // Construir objeto para salvar
      const appointmentData = {
        company_id: company.id,
        customer_id: values.customer_id,
        service_name: selectedService.name,
        service_price: selectedService.price,
        service_duration: selectedService.duration,
        appointment_date: appointmentDate.toISOString(),
        status: 'scheduled',
      };
      
      if (appointment?.id) {
        // Atualizar agendamento existente
        const { error } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', appointment.id);
        
        if (error) throw error;
        
        toast({
          title: getTitle(false) + ' atualizado',
          description: getTitle(false) + ' foi atualizado com sucesso',
        });
      } else {
        // Criar novo agendamento
        const { error } = await supabase
          .from('appointments')
          .insert(appointmentData);
        
        if (error) throw error;
        
        toast({
          title: getTitle(false) + ' criado',
          description: getTitle(false) + ' foi criado com sucesso',
        });
      }
      
      onSaved();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Textos específicos para cada segmento
  const getTitle = (isNew: boolean) => {
    switch(company.segment) {
      case 'restaurante': 
        return isNew ? 'Nova Reserva' : 'Reserva';
      case 'barbearia':
      case 'cabeleireiro':
        return isNew ? 'Novo Agendamento' : 'Agendamento';
      default:
        return isNew ? 'Novo Compromisso' : 'Compromisso';
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
  
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">
        {appointment?.id ? 'Editar ' + getTitle(false) : getTitle(true)}
      </h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="service_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{getServiceLabel()}</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleServiceChange(value);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={`Selecione um ${getServiceLabel().toLowerCase()}`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - {service.duration}min
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className="w-full pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: pt })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          // Desabilita datas no passado
                          return date < new Date(new Date().setHours(0, 0, 0, 0));
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horário</FormLabel>
                  <div className="flex">
                    <FormControl>
                      <div className="relative w-full">
                        <Input type="time" {...field} className="pl-9" />
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      </div>
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <Button 
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
};

export default AppointmentForm;
