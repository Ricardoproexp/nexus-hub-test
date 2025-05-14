
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Calendar, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Logo from '@/components/common/Logo';
import { toast } from '@/hooks/use-toast';

// Mock companies (would be fetched from API in production)
const mockCompanies = [
  { id: '1', name: 'Barbearia Vintage', segment: 'barbearia', address: 'Rua das Flores, 123' },
  { id: '2', name: 'Salão Beleza Pura', segment: 'cabeleireiro', address: 'Av. Principal, 456' },
  { id: '3', name: 'Restaurante Sabor Caseiro', segment: 'restaurante', address: 'Praça Central, 789' }
];

// Mock services based on segment
const mockServices = {
  barbearia: ['Corte de cabelo', 'Barba', 'Corte e barba', 'Tratamento capilar'],
  cabeleireiro: ['Corte feminino', 'Coloração', 'Hidratação', 'Escova', 'Manicure'],
  restaurante: ['Mesa para 2 pessoas', 'Mesa para 4 pessoas', 'Mesa para 6 pessoas', 'Área externa']
};

// Mock time slots
const mockTimeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

interface ScheduleFormValues {
  name: string;
  email: string;
  phone: string;
  service: string;
  date: Date | undefined;
  time: string;
}

const Schedule: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>();
  
  // Find the company by ID
  const company = mockCompanies.find(c => c.id === id);
  
  const form = useForm<ScheduleFormValues>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      service: '',
      date: undefined,
      time: '',
    },
  });
  
  if (!company) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Empresa não encontrada</h1>
        <Button onClick={() => navigate('/search')}>Voltar para busca</Button>
      </div>
    );
  }

  // Get services based on company segment
  const services = mockServices[company.segment as keyof typeof mockServices] || [];

  const onSubmit = (data: ScheduleFormValues) => {
    console.log("Form submitted:", data);
    
    // Show success message
    toast({
      title: "Agendamento realizado!",
      description: `Seu agendamento com ${company.name} foi confirmado para ${format(data.date!, 'dd/MM/yyyy')} às ${data.time}.`,
    });
    
    // Redirect back to search page after short delay
    setTimeout(() => {
      navigate('/search');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="py-6 px-4 sm:px-6 lg:px-8 border-b bg-white">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Logo />
          <Button variant="outline" onClick={() => navigate('/search')}>
            Voltar para busca
          </Button>
        </div>
      </div>
      
      <div className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">{company.name}</CardTitle>
              <p className="text-gray-500">{company.address}</p>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Agendar serviço</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome completo</FormLabel>
                          <FormControl>
                            <Input placeholder="João Silva" {...field} required />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="joao@exemplo.com" {...field} required />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="(99) 99999-9999" {...field} required />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="service"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Serviço</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            required
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um serviço" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {services.map((service) => (
                                <SelectItem key={service} value={service}>
                                  {service}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    variant="outline"
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                    ) : (
                                      <span>Selecione uma data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => {
                                    field.onChange(date);
                                    setDate(date);
                                  }}
                                  disabled={(date) => 
                                    date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                                    date > new Date(new Date().setDate(new Date().getDate() + 30))
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Horário</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              disabled={!date}
                              required
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um horário" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {mockTimeSlots.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Selecione uma data primeiro
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-[#0057B7] hover:bg-[#004494]"
                  >
                    Confirmar agendamento
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
