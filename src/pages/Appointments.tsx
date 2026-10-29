import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useCompany } from '@/context/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import AppointmentForm from '@/components/appointments/AppointmentForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, PlusCircle, Users } from 'lucide-react';
import { eur, playChime } from '@/lib/shop';

export const APPT_STATUSES = [
  { value: 'scheduled', label: 'Pendente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'in_progress', label: 'Em atendimento' },
  { value: 'completed', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'no_show', label: 'Faltou' },
];
const label = (s: string) => APPT_STATUSES.find((x) => x.value === s)?.label || s;
const NEXT: Record<string, { to: string; text: string }[]> = {
  scheduled: [{ to: 'confirmed', text: 'Confirmar' }, { to: 'cancelled', text: 'Cancelar' }],
  confirmed: [{ to: 'in_progress', text: 'Iniciar' }, { to: 'no_show', text: 'Faltou' }, { to: 'cancelled', text: 'Cancelar' }],
  in_progress: [{ to: 'completed', text: 'Concluir' }],
};

const Appointments: React.FC = () => {
  const { company } = useCompany();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [week, setWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const isRest = company.segment === 'restaurante';
  const title = isRest ? 'Reservas' : 'Agenda';

  const load = useCallback(async () => {
    if (!company.id) return;
    const { data, error } = await supabase.from('appointments').select('*, customers:customer_id (name, email, phone)')
      .eq('company_id', company.id).order('appointment_date', { ascending: true });
    if (error) toast.error(error.message);
    setItems(data || []);
    setLoading(false);
  }, [company.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!company.id) return;
    const ch = supabase.channel(`appts-${company.id}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `company_id=eq.${company.id}` }, (p: any) => {
        if (p.eventType === 'INSERT') { playChime(); toast.success(`Nova ${isRest ? 'reserva' : 'marcação'}: ${p.new.service_name}`, { description: format(new Date(p.new.appointment_date), "d MMM HH:mm", { locale: pt }) }); }
        load();
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [company.id, load, isRest]);

  const setStatus = async (id: string, status: string) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, status } : x)));
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) { toast.error(error.message); load(); } else toast.success(`Estado: ${label(status)}`);
  };

  const today = items.filter((a) => isSameDay(new Date(a.appointment_date), new Date()) && a.status !== 'cancelled');
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(week, i)), [week]);

  const Row = ({ a }: { a: any }) => (
    <Card><CardContent className="p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium truncate">{a.customers?.name || 'Cliente'}</div>
          <div className="text-sm text-muted-foreground">{a.service_name} · {format(new Date(a.appointment_date), "EEE d MMM, HH:mm", { locale: pt })}</div>
          <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-1">
            {a.party_size && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{a.party_size}</span>}
            {a.service_price != null && <span>{eur(a.service_price)}</span>}
            {Number(a.deposit_amount) > 0 && <span className="text-primary">Sinal {eur(a.deposit_amount)} pago</span>}
            {a.order_id && <span>+ produtos</span>}
            {a.customers?.phone && <a className="underline" href={`tel:${a.customers.phone}`}>{a.customers.phone}</a>}
          </div>
        </div>
        <Badge variant={a.status === 'cancelled' || a.status === 'no_show' ? 'destructive' : a.status === 'completed' ? 'secondary' : 'default'}>{label(a.status || 'scheduled')}</Badge>
      </div>
      {NEXT[a.status || 'scheduled'] && <div className="flex flex-wrap gap-2">
        {NEXT[a.status || 'scheduled'].map((n) => <Button key={n.to} size="sm" variant={n.to === 'cancelled' || n.to === 'no_show' ? 'outline' : 'default'} onClick={() => setStatus(a.id, n.to)}>{n.text}</Button>)}
      </div>}
    </CardContent></Card>
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">{title}</h1>
          <Button onClick={() => setShowForm(!showForm)}><PlusCircle className="mr-2 h-4 w-4" />{showForm ? 'Fechar' : 'Nova'}</Button>
        </div>
        {showForm && <AppointmentForm onSaved={() => { setShowForm(false); load(); }} onCancel={() => setShowForm(false)} />}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[['Hoje', today.length], ['Pendentes', items.filter((a) => (a.status || 'scheduled') === 'scheduled').length], ['Confirmadas', items.filter((a) => a.status === 'confirmed').length], ['Faturação hoje', eur(today.reduce((s, a) => s + Number(a.service_price || 0), 0))]].map(([k, v]) => (
            <Card key={k as string}><CardContent className="p-3"><div className="text-xs text-muted-foreground">{k}</div><div className="text-xl font-bold">{v}</div></CardContent></Card>
          ))}
        </div>
        {loading ? <Skeleton className="h-64" /> : (
          <Tabs defaultValue="board">
            <TabsList><TabsTrigger value="board">Quadro</TabsTrigger><TabsTrigger value="week">Semana</TabsTrigger><TabsTrigger value="list">Lista</TabsTrigger></TabsList>
            <TabsContent value="board">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {APPT_STATUSES.map((s) => {
                  const col = items.filter((a) => (a.status || 'scheduled') === s.value);
                  return <div key={s.value} className="min-w-[260px] w-[260px] space-y-2"><div className="font-semibold text-sm">{s.label} <span className="text-muted-foreground">({col.length})</span></div>{col.map((a) => <Row key={a.id} a={a} />)}</div>;
                })}
              </div>
            </TabsContent>
            <TabsContent value="week">
              <div className="flex items-center gap-2 mb-3">
                <Button size="icon" variant="outline" onClick={() => setWeek(addDays(week, -7))}><ChevronLeft /></Button>
                <span className="text-sm font-medium">{format(week, 'd MMM', { locale: pt })} – {format(addDays(week, 6), 'd MMM', { locale: pt })}</span>
                <Button size="icon" variant="outline" onClick={() => setWeek(addDays(week, 7))}><ChevronRight /></Button>
              </div>
              <div className="grid gap-3 md:grid-cols-7">
                {days.map((d) => { const list = items.filter((a) => isSameDay(new Date(a.appointment_date), d) && a.status !== 'cancelled'); return (
                  <div key={d.toISOString()} className={`rounded-lg border bg-background p-2 ${isSameDay(d, new Date()) ? 'ring-1 ring-primary' : ''}`}>
                    <div className="text-xs font-semibold mb-2 capitalize">{format(d, 'EEE d', { locale: pt })}</div>
                    {list.length === 0 ? <p className="text-xs text-muted-foreground">—</p> : list.map((a) => <div key={a.id} className="text-xs rounded bg-primary/10 p-1 mb-1"><b>{format(new Date(a.appointment_date), 'HH:mm')}</b> {a.customers?.name || a.service_name}</div>)}
                  </div>); })}
              </div>
            </TabsContent>
            <TabsContent value="list" className="space-y-2">
              {items.length === 0 ? <p className="text-muted-foreground text-center py-10">Ainda sem marcações. Partilhe o link da sua página para começar a receber.</p> : [...items].reverse().map((a) => <Row key={a.id} a={a} />)}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Appointments;
