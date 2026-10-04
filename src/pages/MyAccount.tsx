import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { db, eur, PROGRESS_STEPS, STATUS_LABEL } from '@/lib/shop';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Logo from '@/components/common/Logo';
import { Loader2, Package, Truck, CheckCircle2, ClipboardList, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';

const ICONS = [ClipboardList, Package, Truck, CheckCircle2];

const Progress: React.FC<{ status: string; pickup: boolean }> = ({ status, pickup }) => {
  if (status === 'cancelled') return <Badge variant="destructive">Cancelada</Badge>;
  const idx = PROGRESS_STEPS.indexOf(status);
  return (
    <div className="flex items-center w-full">
      {PROGRESS_STEPS.map((s, i) => {
        const Icon = ICONS[i];
        const done = i <= idx;
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center ${done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}><Icon className="h-4 w-4" /></div>
              <span className={`text-[11px] text-center ${done ? 'font-medium' : 'text-muted-foreground'}`}>{s === 'shipped' && pickup ? 'Pronta' : STATUS_LABEL[s]}</span>
            </div>
            {i < PROGRESS_STEPS.length - 1 && <div className={`flex-1 h-1 mx-1 mb-5 rounded ${i < idx ? 'bg-primary' : 'bg-muted'}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const MyAccount: React.FC = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [appts, setAppts] = useState<any[]>([]);

  const load = async (uid: string) => {
    const [{ data: o }, { data: cu }] = await Promise.all([
      db.from('orders').select('*, order_items(*), companies(name)').eq('customer_user_id', uid).order('created_at', { ascending: false }),
      supabase.from('customers').select('id').eq('user_id', uid).maybeSingle(),
    ]);
    setOrders(o || []);
    if (cu) {
      const { data: a } = await db.from('appointments').select('*, companies(name, segment)').eq('customer_id', cu.id).order('appointment_date', { ascending: false });
      setAppts(a || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id;
      if (!uid) { navigate('/customer/auth'); return; }
      setUserId(uid);
      load(uid);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`my-orders-${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `customer_user_id=eq.${userId}` }, (p: any) => {
        toast.info(`Encomenda #${p.new.order_number}: ${STATUS_LABEL[p.new.status]}`);
        load(userId);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  const cancelOrder = async (id: string) => {
    if (!confirm('Cancelar esta encomenda?')) return;
    const { error } = await db.rpc('cancel_my_order', { p_order_id: id });
    error ? toast.error(error.message) : (toast.success('Encomenda cancelada'), load(userId!));
  };
  const cancelAppt = async (id: string) => {
    if (!confirm('Cancelar esta reserva?')) return;
    const { error } = await db.rpc('cancel_my_appointment', { p_id: id });
    error ? toast.error(error.message) : (toast.success('Reserva cancelada'), load(userId!));
  };

  const logout = async () => { await supabase.auth.signOut(); navigate('/search'); };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-background border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/search"><Logo /></Link>
          <Button size="sm" variant="ghost" onClick={logout}><LogOut className="h-4 w-4 mr-1" />Sair</Button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">A Minha Conta</h1>
        {loading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : (
          <Tabs defaultValue="orders">
            <TabsList><TabsTrigger value="orders">Encomendas ({orders.length})</TabsTrigger><TabsTrigger value="appts">Reservas ({appts.length})</TabsTrigger></TabsList>

            <TabsContent value="orders" className="space-y-3">
              {orders.length === 0 && <p className="text-muted-foreground text-sm py-6">Ainda não fez encomendas.</p>}
              {orders.map((o) => (
                <div key={o.id} className="bg-background border rounded-lg p-4 space-y-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="font-semibold">#{o.order_number} · {o.companies?.name}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(o.created_at), "dd MMM yyyy, HH:mm", { locale: pt })} · {o.delivery_method === 'delivery' ? 'Envio ao domicílio' : 'Recolha na loja'}</p>
                    </div>
                    <div className="text-right"><p className="font-bold">{eur(o.total)}</p><p className="text-xs text-muted-foreground">{o.payment_status === 'paid_test' ? 'Pago (teste)' : o.payment_status}</p></div>
                  </div>
                  <Progress status={o.status} pickup={o.delivery_method === 'pickup'} />
                  {o.tracking_code && <p className="text-sm bg-muted rounded p-2"><Truck className="h-4 w-4 inline mr-1" />{o.carrier} · Rastreio: <span className="font-mono font-medium">{o.tracking_code}</span></p>}
                  <div className="text-sm text-muted-foreground">{o.order_items.map((i: any) => `${i.quantity}× ${i.product_name}${i.variant_name && i.variant_name !== 'Único' ? ` (${i.variant_name})` : ''}`).join(' · ')}</div>
                  {o.status === 'new' && <Button size="sm" variant="outline" className="text-destructive" onClick={() => cancelOrder(o.id)}>Cancelar encomenda</Button>}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="appts" className="space-y-3">
              {appts.length === 0 && <p className="text-muted-foreground text-sm py-6">Ainda não tem reservas.</p>}
              {appts.map((a) => {
                const future = new Date(a.appointment_date) > new Date();
                return (
                  <div key={a.id} className="bg-background border rounded-lg p-4 flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-semibold">{a.service_name} · {a.companies?.name}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(a.appointment_date), "EEEE, dd MMM yyyy 'às' HH:mm", { locale: pt })}{a.party_size ? ` · ${a.party_size} pessoas` : ''}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {a.service_price ? `Valor: ${eur(a.service_price)}` : ''}{Number(a.deposit_amount) > 0 ? ` · Pago antecipadamente: ${eur(a.deposit_amount)} (teste)` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={a.status === 'cancelled' ? 'destructive' : future ? 'default' : 'secondary'}>{a.status === 'cancelled' ? 'Cancelada' : future ? 'Agendada' : 'Concluída'}</Badge>
                      {a.status !== 'cancelled' && future && <Button size="sm" variant="outline" onClick={() => cancelAppt(a.id)}>Cancelar</Button>}
                    </div>
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default MyAccount;
