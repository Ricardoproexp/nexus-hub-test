import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useCustomer } from '@/context/CustomerContext';
import { supabase } from '@/integrations/supabase/client';
import Logo from '@/components/common/Logo';
import AuthDialog from '@/components/auth/AuthDialog';
import { UserCircle, Loader2, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

type Company = {
  id: string;
  name: string;
  segment: string | null;
  address: string | null;
  phone: string | null;
  avatar_url: string | null;
};

type ServiceType = {
  id: string;
  name: string;
  price: number | null;
  duration: number;
};

const OPEN_HOUR = 8;
const CLOSE_HOUR = 20;

const Schedule: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { customer } = useCustomer();

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<{ time: Date; isAvailable: boolean }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  // Carregar empresa + serviços reais
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);

      const [{ data: companyData, error: companyError }, { data: servicesData }] = await Promise.all([
        supabase
          .from('companies')
          .select('id, name, segment, address, phone, avatar_url')
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from('services')
          .select('id, name, price, duration')
          .eq('company_id', id)
          .order('name'),
      ]);

      if (companyError) {
        console.error('Erro ao carregar empresa:', companyError);
      }

      setCompany(companyData as Company | null);
      setServices((servicesData || []) as ServiceType[]);
      setLoading(false);
    };

    load();
  }, [id]);

  const service = services.find((s) => s.id === selectedService) || null;

  // Gerar horários reais com base nos agendamentos existentes
  const loadSlots = useCallback(async () => {
    if (!selectedDate || !service || !id) return;
    setSlotsLoading(true);

    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: booked } = await supabase
      .from('appointments')
      .select('appointment_date, service_duration, status')
      .eq('company_id', id)
      .gte('appointment_date', dayStart.toISOString())
      .lte('appointment_date', dayEnd.toISOString());

    const busy = (booked || [])
      .filter((b) => b.status !== 'cancelled')
      .map((b) => {
        const start = new Date(b.appointment_date).getTime();
        return { start, end: start + (b.service_duration || 30) * 60000 };
      });

    const step = 30;
    const duration = service.duration || 30;
    const slots: { time: Date; isAvailable: boolean }[] = [];
    const now = Date.now();

    for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
      for (let minute = 0; minute < 60; minute += step) {
        const slotDate = new Date(selectedDate);
        slotDate.setHours(hour, minute, 0, 0);

        const slotStart = slotDate.getTime();
        const slotEnd = slotStart + duration * 60000;

        const closing = new Date(selectedDate);
        closing.setHours(CLOSE_HOUR, 0, 0, 0);
        if (slotEnd > closing.getTime()) continue;

        const overlaps = busy.some((b) => slotStart < b.end && slotEnd > b.start);
        const inPast = slotStart <= now;

        slots.push({ time: slotDate, isAvailable: !overlaps && !inPast });
      }
    }

    setTimeSlots(slots);
    setSelectedTime(null);
    setSlotsLoading(false);
  }, [selectedDate, service, id]);

  useEffect(() => {
    if (selectedDate && selectedService) {
      loadSlots();
    } else {
      setTimeSlots([]);
    }
  }, [selectedDate, selectedService, loadSlots]);

  // Garante que existe um registo de cliente ligado à conta autenticada
  const ensureCustomerId = async (): Promise<string | null> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return null;

    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: created, error } = await supabase
      .from('customers')
      .insert({
        user_id: user.id,
        name: customer?.name || (user.user_metadata as any)?.name || user.email?.split('@')[0] || 'Cliente',
        email: customer?.email || user.email || '',
        phone: customer?.phone || (user.user_metadata as any)?.phone || '',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erro ao criar cliente:', error);
      return null;
    }
    return created.id;
  };

  const handleSchedule = async () => {
    if (!company || !service || !selectedTime) {
      toast({
        title: 'Informações incompletas',
        description: 'Selecione serviço, data e horário',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const customerId = await ensureCustomerId();
      if (!customerId) {
        setSubmitting(false);
        setShowAuthDialog(true);
        toast({
          title: 'Entre na sua conta',
          description: 'Faça login ou cadastre-se para confirmar o agendamento',
        });
        return;
      }

      const { error } = await supabase.from('appointments').insert({
        company_id: company.id,
        customer_id: customerId,
        service_name: service.name,
        service_price: service.price,
        service_duration: service.duration,
        appointment_date: selectedTime.toISOString(),
        status: 'scheduled',
      });

      if (error) throw error;

      toast({
        title: 'Agendamento confirmado',
        description: `${service.name} em ${format(selectedTime, "dd 'de' MMMM 'às' HH:mm", { locale: pt })}`,
      });

      setSelectedTime(null);
      await loadSlots();
      setTimeout(() => navigate('/search'), 1500);
    } catch (error: any) {
      console.error('Erro ao agendar:', error);
      toast({
        title: 'Não foi possível agendar',
        description: error.message || 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getSegmentLabel = (segment: string | null) => {
    switch (segment) {
      case 'barbearia':
        return 'Barbearia/Cabeleireiro';
      case 'cabeleireiro':
        return 'Cabeleireiro';
      case 'restaurante':
        return 'Restaurante';
      case 'loja':
        return 'Loja de Produtos';
      default:
        return segment || 'Empresa';
    }
  };

  const getActionLabel = () => (company?.segment === 'restaurante' ? 'Reservar' : 'Agendar');
  const getServiceWord = () => (company?.segment === 'restaurante' ? 'mesa' : 'serviço');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-[#0057B7]" />
        <p className="text-gray-600 text-sm">A carregar empresa...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p>Empresa não encontrada</p>
        <Button size="sm" onClick={() => navigate('/search')} className="mt-4">
          Voltar para busca
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="py-4 px-4 sm:px-6 lg:px-8 border-b bg-white">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Logo />
          <div className="flex gap-2">
            {customer ? (
              <div className="flex items-center gap-2">
                <div className="text-sm text-right">
                  <p className="font-medium text-xs">{customer.name}</p>
                  <p className="text-gray-500 text-xs">{customer.email}</p>
                </div>
                <UserCircle className="h-5 w-5" />
              </div>
            ) : (
              <Button size="xs" onClick={() => setShowAuthDialog(true)}>
                Entrar / Cadastrar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-grow py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-5">
            <Button size="xs" variant="outline" onClick={() => navigate('/search')} className="mb-3">
              ← Voltar para busca
            </Button>
            <div className="flex items-center gap-3">
              {company.avatar_url && (
                <img
                  src={company.avatar_url}
                  alt={`Logótipo de ${company.name}`}
                  className="h-12 w-12 rounded-full object-cover border-2 border-black"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold">{company.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                    {getSegmentLabel(company.segment)}
                  </span>
                  {company.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {company.address}
                    </span>
                  )}
                  {company.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> {company.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{getActionLabel()} {getServiceWord()}</CardTitle>
              <CardDescription>
                Selecione o {getServiceWord()}, a data e o horário disponível
              </CardDescription>
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <div className="border rounded-md p-8 text-center bg-gray-50">
                  <p className="text-gray-600">Esta empresa ainda não publicou serviços disponíveis.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">1. Selecione o {getServiceWord()}</h3>
                    <div className="space-y-2">
                      {services.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className={`w-full text-left border rounded-md p-3 transition-colors ${
                            selectedService === s.id ? 'border-[#0057B7] bg-blue-50' : 'hover:border-gray-400'
                          }`}
                          onClick={() => setSelectedService(s.id)}
                        >
                          <div className="flex justify-between">
                            <p className="font-medium">{s.name}</p>
                            {!!s.price && s.price > 0 && (
                              <p>{Number(s.price).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</p>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{s.duration} min</p>
                        </button>
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
                      slotsLoading ? (
                        <div className="border rounded-md p-6 flex items-center justify-center bg-gray-50">
                          <Loader2 className="h-5 w-5 animate-spin text-[#0057B7]" />
                        </div>
                      ) : timeSlots.some((s) => s.isAvailable) ? (
                        <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
                          {timeSlots.map((slot, index) => (
                            <button
                              key={index}
                              className={`py-2 px-3 rounded-md text-center text-sm ${
                                slot.isAvailable
                                  ? selectedTime && slot.time.getTime() === selectedTime.getTime()
                                    ? 'bg-[#0057B7] text-white'
                                    : 'bg-white border hover:border-[#0057B7]'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                              }`}
                              disabled={!slot.isAvailable}
                              onClick={() => setSelectedTime(slot.time)}
                            >
                              {format(slot.time, 'HH:mm')}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="border rounded-md p-6 text-center bg-gray-50">
                          <p className="text-gray-500 text-sm">Sem horários disponíveis nesta data</p>
                        </div>
                      )
                    ) : (
                      <div className="border rounded-md p-6 flex items-center justify-center bg-gray-50">
                        <p className="text-gray-500 text-center text-sm">
                          {!selectedService
                            ? `Selecione um ${getServiceWord()} primeiro`
                            : 'Selecione uma data para ver os horários disponíveis'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <Separator />
            <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between pt-6">
              <div className="text-sm">
                {service && selectedDate && selectedTime && (
                  <p className="flex items-center gap-2 text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-[#0057B7]" />
                    {service.name} • {format(selectedDate, "dd 'de' MMMM", { locale: pt })} •{' '}
                    {format(selectedTime, 'HH:mm')}
                    {!!service.price && service.price > 0 && (
                      <> • {Number(service.price).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</>
                    )}
                  </p>
                )}
              </div>
              <Button
                onClick={handleSchedule}
                disabled={!selectedService || !selectedDate || !selectedTime || submitting}
                className="bg-[#0057B7] hover:bg-[#004494]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> A confirmar...
                  </>
                ) : (
                  `${getActionLabel()} agora`
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </div>
  );
};

export default Schedule;
