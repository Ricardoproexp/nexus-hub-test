import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useCompany } from '@/context/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { db, eur, ORDER_STATUSES, STATUS_LABEL, CARRIERS } from '@/lib/shop';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Truck, Store, Search } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';

const NEXT: Record<string, string> = { new: 'preparing', preparing: 'shipped', shipped: 'completed' };
const NEXT_LABEL: Record<string, string> = { new: 'Iniciar separação', preparing: 'Marcar enviada/pronta', shipped: 'Concluir' };

const Orders: React.FC = () => {
  const { company } = useCompany();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('new');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [carrier, setCarrier] = useState('');
  const [tracking, setTracking] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!company.id) return;
    const { data } = await db.from('orders').select('*, order_items(*)').eq('company_id', company.id).order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!company.id) return;
    const ch = supabase
      .channel(`orders-page-${company.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `company_id=eq.${company.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [company.id]);

  const open = async (o: any) => {
    setSelected(o);
    setCarrier(o.carrier || '');
    setTracking(o.tracking_code || '');
    const { data } = await db.from('order_status_history').select('*').eq('order_id', o.id).order('created_at');
    setHistory(data || []);
  };

  const update = async (patch: any) => {
    if (!selected) return;
    setBusy(true);
    const { data, error } = await db.from('orders').update(patch).eq('id', selected.id).select('*, order_items(*)').single();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success('Encomenda atualizada');
    await open(data);
    load();
  };

  const counts = useMemo(() => Object.fromEntries(ORDER_STATUSES.map((s) => [s.value, orders.filter((o) => o.status === s.value).length])), [orders]);
  const list = orders.filter((o) => o.status === tab && (
    !q || `${o.order_number} ${o.customer_name} ${o.customer_email}`.toLowerCase().includes(q.toLowerCase())
  ));

  const addr = (a: any) => a ? [a.street, a.postal_code, a.city, a.country].filter(Boolean).join(', ') : '—';

  return (
    <DashboardLayout title="Encomendas">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto">
            {ORDER_STATUSES.map((s) => (
              <TabsTrigger key={s.value} value={s.value}>{s.label} <Badge variant="secondary" className="ml-1">{counts[s.value] || 0}</Badge></TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative md:w-64">
          <Search className="h-4 w-4 absolute left-2.5 top-3 text-muted-foreground" />
          <Input className="pl-8" placeholder="Nº, nome ou email" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {loading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : list.length === 0 ? (
        <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground bg-background">Sem encomendas neste estado.</div>
      ) : (
        <div className="bg-background border rounded-lg divide-y">
          {list.map((o) => (
            <button key={o.id} onClick={() => open(o)} className="w-full text-left p-4 hover:bg-muted/50 flex flex-wrap gap-3 items-center justify-between">
              <div>
                <p className="font-semibold">#{o.order_number} · {o.customer_name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(o.created_at), "dd MMM yyyy, HH:mm", { locale: pt })} · {o.order_items?.length || 0} artigos
                  {o.kind === 'booking' && ' · com reserva'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">{o.delivery_method === 'delivery' ? <><Truck className="h-3 w-3 mr-1" />Envio</> : <><Store className="h-3 w-3 mr-1" />Recolha</>}</Badge>
                <span className="font-semibold">{eur(o.total)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader><DialogTitle>Encomenda #{selected.order_number} — {STATUS_LABEL[selected.status]}</DialogTitle></DialogHeader>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium mb-1">Cliente</p>
                  <p>{selected.customer_name}</p>
                  <p className="text-muted-foreground">{selected.customer_email}</p>
                  <p className="text-muted-foreground">{selected.customer_phone}</p>
                  {selected.nif && <p className="text-muted-foreground">NIF: {selected.nif}</p>}
                </div>
                <div>
                  <p className="font-medium mb-1">{selected.delivery_method === 'delivery' ? 'Envio para' : 'Recolha na loja'}</p>
                  {selected.delivery_method === 'delivery' && <p>{addr(selected.shipping_address)}</p>}
                  <p className="font-medium mt-2 mb-1">Faturação</p>
                  <p className="text-muted-foreground">{addr(selected.billing_address || selected.shipping_address)}</p>
                </div>
              </div>
              {selected.notes && <p className="text-sm bg-muted p-2 rounded">Nota: {selected.notes}</p>}

              <div className="border rounded-md divide-y text-sm">
                {selected.order_items.map((i: any) => (
                  <div key={i.id} className="flex justify-between p-2">
                    <span>{i.quantity}× {i.product_name} {i.variant_name && i.variant_name !== 'Único' && <span className="text-muted-foreground">({i.variant_name})</span>}</span>
                    <span>{eur(i.unit_price * i.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between p-2 text-muted-foreground"><span>Portes</span><span>{eur(selected.shipping_fee)}</span></div>
                <div className="flex justify-between p-2 font-semibold"><span>Total ({selected.payment_status === 'paid_test' ? 'Pago (teste)' : selected.payment_status})</span><span>{eur(selected.total)}</span></div>
              </div>

              {selected.delivery_method === 'delivery' && selected.status !== 'cancelled' && (
                <div className="grid sm:grid-cols-[160px_1fr_auto] gap-2 items-end">
                  <div><Label>Transportadora</Label>
                    <Select value={carrier} onValueChange={setCarrier}>
                      <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
                      <SelectContent>{CARRIERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Código de rastreio</Label><Input value={tracking} maxLength={60} onChange={(e) => setTracking(e.target.value)} /></div>
                  <Button variant="outline" disabled={busy || !tracking.trim()} onClick={() => update({ carrier: carrier || null, tracking_code: tracking.trim() })}>Guardar</Button>
                </div>
              )}

              <div>
                <p className="font-medium text-sm mb-2">Linha do tempo</p>
                <ol className="border-l-2 border-primary/30 ml-2 space-y-3">
                  {history.map((h) => (
                    <li key={h.id} className="ml-4 relative">
                      <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-primary" />
                      <p className="text-sm font-medium">{STATUS_LABEL[h.status] || h.status}{h.note && <span className="font-normal text-muted-foreground"> — {h.note}</span>}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(h.created_at), "dd/MM/yyyy HH:mm", { locale: pt })}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                {!['cancelled', 'completed'].includes(selected.status) && (
                  <Button variant="outline" className="text-destructive" disabled={busy} onClick={() => confirm('Cancelar encomenda? O stock será reposto.') && update({ status: 'cancelled' })}>Cancelar encomenda</Button>
                )}
                {NEXT[selected.status] && (
                  <Button disabled={busy} onClick={() => update({ status: NEXT[selected.status] })}>{NEXT_LABEL[selected.status]}</Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Orders;
