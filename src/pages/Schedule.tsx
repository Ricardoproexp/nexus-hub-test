
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useCustomer } from '@/context/CustomerContext';
import Logo from '@/components/common/Logo';
import { UserCircle, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

type Company = {
  id: string;
  name: string;
  segment: 'barbearia' | 'cabeleireiro' | 'restaurante';
  address: string;
};

type ServiceType = {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
};

// Mock data for demonstration
const mockCompanies: Company[] = [
  { id: '1', name: 'Barbearia Vintage', segment: 'barbearia', address: 'Rua das Flores, 123' },
  { id: '2', name: 'Salão Beleza Pura', segment: 'cabeleireiro', address: 'Av. Principal, 456' },
  { id: '3', name: 'Restaurante Sabor Caseiro', segment: 'restaurante', address: 'Praça Central, 789' },
];

const mockServices: Record<string, ServiceType[]> = {
  'barbearia': [
    { id: 'b1', name: 'Corte de Cabelo', price: 35, duration: 30 },
    { id: 'b2', name: 'Barba', price: 25, duration: 20 },
    { id: 'b3', name: 'Corte + Barba', price: 55, duration: 45 },
  ],
  'cabeleireiro': [
    { id: 'c1', name: 'Corte Feminino', price: 70, duration: 60 },
    { id: 'c2', name: 'Coloração', price: 120, duration: 90 },
    { id: 'c3', name: 'Escova', price: 50, duration: 45 },
  ],
  'restaurante': [
    { id: 'r1', name: 'Mesa para 2 pessoas', price: 0, duration: 90 },
    { id: 'r2', name: 'Mesa para 4 pessoas', price: 0, duration: 90 },
    { id: 'r3', name: 'Mesa para 6 pessoas', price: 0, duration: 120 },
  ],
};

// Generate time slots from 8am to 8pm
const generateTimeSlots = (date: Date, serviceDuration: number = 30) => {
  const slots = [];
  const startHour = 8;
  const endHour = 20;
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += serviceDuration) {
      if (hour === endHour - 1 && minute + serviceDuration > 60) continue;
      
      const slotDate = new Date(date);
      slotDate.setHours(hour, minute, 0, 0);
      
      // Randomly make some slots unavailable
      const isAvailable = Math.random() > 0.3;
      
      slots.push({
        time: slotDate,
        isAvailable,
      });
    }
  }
  
  return slots;
};

const Schedule: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<{ time: Date; isAvailable: boolean }[]>([]);
  const { customer } = useCustomer();
  
  useEffect(() => {
    // In a real app, this would be an API call
    const foundCompany = mockCompanies.find(c => c.id === id);
    if (foundCompany) {
      setCompany(foundCompany);
      setServices(mockServices[foundCompany.segment] || []);
    }
  }, [id]);

  useEffect(() => {
    if (selectedDate && selectedService) {
      const service = services.find(s => s.id === selectedService);
      setTimeSlots(generateTimeSlots(selectedDate, service?.duration || 30));
    }
  }, [selectedDate, selectedService, services]);

  const handleSchedule = () => {
    if (!customer) {
      toast({
        title: "Login necessário",
        description: "Faça login ou cadastre-se para continuar",
      });
      navigate('/customer/auth');
      return;
    }

    if (!selectedService || !selectedDate || !selectedTime) {
      toast({
        title: "Informações incompletas",
        description: "Por favor, selecione serviço, data e horário",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would be an API call
    toast({
      title: "Agendamento realizado",
      description: `Seu agendamento foi confirmado para ${format(selectedTime, "dd 'de' MMMM 'às' HH:mm", { locale: pt })}`,
    });

    // Redirect to search page after successful scheduling
    setTimeout(() => {
      navigate('/search');
    }, 2000);
  };

  const getSegmentLabel = (segment: string) => {
    switch(segment) {
      case 'barbearia':
        return 'Barbearia';
      case 'cabeleireiro':
        return 'Cabeleireiro/Loja Física';
      case 'restaurante':
        return 'Restaurante';
      default:
        return segment;
    }
  };

  const getServiceLabel = (segment: string) => {
    switch(segment) {
      case 'restaurante':
        return 'Reservar';
      default:
        return 'Agendar';
    }
  };

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p>Empresa não encontrada</p>
        <Button onClick={() => navigate('/search')} className="mt-4">
          Voltar para busca
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="py-6 px-4 sm:px-6 lg:px-8 border-b bg-white">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Logo />
          <div className="flex gap-3">
            {customer ? (
              <div className="flex items-center gap-3">
                <div className="text-sm text-right">
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-gray-500 text-xs">{customer.email}</p>
                </div>
                <UserCircle className="h-6 w-6" />
              </div>
            ) : (
              <Button onClick={() => navigate('/customer/auth')}>
                Entrar / Cadastrar
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="outline" onClick={() => navigate('/search')} className="mb-4">
              ← Voltar para busca
            </Button>
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <div className="flex items-center mt-1">
              <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full mr-2">
                {getSegmentLabel(company.segment)}
              </span>
              <p className="text-gray-600">{company.address}</p>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Agendar serviço</CardTitle>
              <CardDescription>
                Selecione o serviço, a data e o horário para agendar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-medium mb-3">1. Selecione o serviço</h3>
                  <div className="space-y-2">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className={`border rounded-md p-3 cursor-pointer transition-colors ${
                          selectedService === service.id
                            ? 'border-[#0057B7] bg-blue-50'
                            : 'hover:border-gray-400'
                        }`}
                        onClick={() => setSelectedService(service.id)}
                      >
                        <div className="flex justify-between">
                          <p className="font-medium">{service.name}</p>
                          {service.price > 0 && <p>{service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'EUR' })}</p>}
                        </div>
                        <p className="text-sm text-gray-500">{service.duration} min</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">2. Selecione a data</h3>
                  <Card className="border shadow-none">
                    <CardContent className="p-3">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => {
                          // Disable dates in the past
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        initialFocus
                        className="rounded-md"
                      />
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">3. Selecione o horário</h3>
                  {selectedDate && selectedService ? (
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map((slot, index) => (
                        <button
                          key={index}
                          className={`
                            py-2 px-3 rounded-md text-center text-sm
                            ${slot.isAvailable 
                              ? selectedTime && slot.time.getTime() === selectedTime.getTime()
                                ? 'bg-[#0057B7] text-white'
                                : 'bg-white border hover:border-[#0057B7]' 
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }
                          `}
                          disabled={!slot.isAvailable}
                          onClick={() => setSelectedTime(slot.time)}
                        >
                          {format(slot.time, 'HH:mm')}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="border rounded-md p-6 flex items-center justify-center bg-gray-50">
                      <p className="text-gray-500 text-center text-sm">
                        {!selectedService 
                          ? "Selecione um serviço primeiro"
                          : "Selecione uma data para ver os horários disponíveis"
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <Separator />
            <CardFooter className="flex justify-between pt-6">
              <div>
                {selectedService && selectedDate && selectedTime && (
                  <div className="text-sm">
                    <p className="text-gray-500">
                      {services.find(s => s.id === selectedService)?.name} • {format(selectedDate, "dd 'de' MMMM", { locale: pt })} • {format(selectedTime, 'HH:mm')}
                    </p>
                  </div>
                )}
              </div>
              <Button 
                onClick={handleSchedule}
                disabled={!selectedService || !selectedDate || !selectedTime}
                className="bg-[#0057B7] hover:bg-[#004494]"
              >
                {customer 
                  ? `${getServiceLabel(company.segment)} agora` 
                  : "Entre para agendar"
                }
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
