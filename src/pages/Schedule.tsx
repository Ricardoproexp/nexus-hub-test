import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AuthDialog from '@/components/auth/AuthDialog';
import { ArrowLeft, CalendarPlus, CheckCircle2, Loader2, MapPin, Minus, Plus, Users } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { db, eur, loadSettings, computeDeposit, CompanySettings, Product, productImages, variantPrice } from '@/lib/shop';

type Service = { id: string; name: string; price: number | null; duration: number };
type Company = { id: string; name: string; segment: string | null; address: string | null; avatar_url: string | null };

function icsLink(title: string, start: Date, minutes: number, location: string) {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const end = new Date(start.getTime() + minutes * 60000);
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${f(start)}\nDTEND:${f(end)}\nSUMMARY:${title}\nLOCATION:${location}\nEND:VEVENT\nEND:VCALENDAR`;
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
}

const Schedule: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<Date | null>(null);
  const [busy, setBusy] = useState<{ start: number; end: number }[]>([]);
  const [party, setParty] = useState(2);
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [contact, setContact] = useState({ name: '', email: '', phone: '' });
  const [authOpen, setAuthOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ start: Date; service: Service } | null>(null);

  const isRestaurant = company?.segment === 'restaurante';

  useEffect(() => {
    const sync = async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      setUserId(u?.id ?? null);
      if (u) {
        const { data: c } = await supabase.from('customers').select('name,email,phone').eq('user_id', u.id).maybeSingle();
        setContact((p) => ({ name: p.name || c?.name || '', email: p.email || c?.email || u.email || '', phone: p.phone || c?.phone || '' }));
      }
    };
    sync();
    const { data: sub } = supabase.auth.onAuthStateChange(() => sync());
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [c, s, p, st] = await Promise.all([
        supabase.from('companies').select('id,name,segment,address,avatar_url').eq('id', id).maybeSingle(),
        supabase.from('services').select('id,name,price,duration').eq('company_id', id).order('name'),
        db.from('products').select('*, product_images(*), product_variants(*)').eq('company_id', id).eq('active', true).limit(12),
        loadSettings(id),
      ]);
      setCompany(c.data as Company | null);
      setServices((s.data || []) as Service[]);
      setProducts(((p.data || []) as Product[]).filter((x) => (x.product_variants || []).some((v) => v.stock > 0)));
      setSettings(st);
      setLoading(false);
    })();
  }, [id]);

  const service = services.find((s) => s.id === serviceId) || null;

  useEffect(() => {
    if (!date || !id) return;
    const from = new Date(date); from.setHours(0, 0, 0, 0);
    const to = new Date(from); to.setDate(to.getDate() + 1);
    setTime(null);
    db.rpc('get_booked_slots', { p_company_id: id, p_from: from.toISOString(), p_to: to.toISOString() }).then(({ data }: any) => {
      setBusy((data || []).map((b: any) => { const st = new Date(b.appointment_date).getTime(); return { start: st, end: st + (b.service_duration || 30) * 60000 }; }));
    });
  }, [date, id]);

  const slots = useMemo(() => {
    if (!date || !service || !settings) return [];
    const out: { t: Date; ok: boolean }[] = [];
    const dur = service.duration || 30;
    for (let m = settings.open_hour * 60; m + dur <= settings.close_hour * 60; m += settings.slot_minutes || 30) {
      const t = new Date(date); t.setHours(Math.floor(m / 60), m % 60, 0, 0);
      const s = t.getTime(), e = s + dur * 60000;
      out.push({ t, ok: s > Date.now() && !busy.some((b) => s < b.end && e > b.start) });
    }
    return out;
  }, [date, service, settings, busy]);

  const deposit = service && settings ? computeDeposit(settings, Number(service.price || 0)) : 0;
  const extraItems = products.flatMap((p) => (p.product_variants || []).filter((v) => extras[v.id]).map((v) => ({ p, v, q: extras[v.id] })));
  const extrasTotal = extraItems.reduce((s, i) => s + variantPrice(i.p, i.v) * i.q, 0);

  const confirm = async () => {
    if (!userId) { setAuthOpen(true); return; }
    if (!service || !time) return;
    if (!contact.name.trim() || !contact.email.trim()) { toast.error('Indique nome e email'); return; }
    setSubmitting(true);
    const { error } = await db.rpc('place_booking', {
      p_company_id: id, p_service_id: service.id, p_date: time.toISOString(),
      p_party_size: isRestaurant ? party : null, p_customer: contact,
      p_items: extraItems.map((i) => ({ variant_id: i.v.id, quantity: i.q })),
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setDone({ start: time, service });
  };

  if (loading) return <div className="max-w-3xl mx-auto p-4 space-y-4"><Skeleton className="h-24" /><Skeleton className="h-64" /></div>;
  if (!company) return <div className="p-8 text-center"><p className="mb-4">Empresa não encontrada.</p><Button onClick={() => navigate('/search')}>Voltar</Button></div>;

  if (done) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 space-y-4">
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
            <h1 className="text-2xl font-bold">{isRestaurant ? 'Reserva confirmada!' : 'Agendamento confirmado!'}</h1>
            <p className="text-muted-foreground">{done.service.name} em {company.name}<br />{format(done.start, "EEEE, d 'de' MMMM 'às' HH:mm", { locale: pt })}</p>
            {deposit > 0 && <p className="text-sm">Sinal pago: <b>{eur(deposit)}</b> (pagamento de teste)</p>}
            {extrasTotal > 0 && <p className="text-sm">Produtos a levantar: <b>{eur(extrasTotal)}</b></p>}
            <div className="flex flex-col gap-2 pt-2">
              <Button asChild variant="outline"><a href={icsLink(`${done.service.name} - ${company.name}`, done.start, done.service.duration, company.address || '')} download="reserva.ics"><CalendarPlus className="mr-2 h-4 w-4" />Adicionar ao calendário</a></Button>
              <Button onClick={() => navigate('/conta')}>Ver as minhas reservas</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 pb-28">
      <header className="bg-background border-b">
        <div className="max-w-3xl mx-auto p-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Voltar"><ArrowLeft /></Button>
          {company.avatar_url && <img src={company.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />}
          <div className="min-w-0">
            <h1 className="font-bold truncate">{company.name}</h1>
            {company.address && <p className="text-xs text-muted-foreground flex items-center gap-1 truncate"><MapPin className="h-3 w-3" />{company.address}</p>}
          </div>
          <Button asChild variant="outline" size="sm" className="ml-auto"><Link to={`/loja/${company.id}`}>Loja</Link></Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-lg">1. {isRestaurant ? 'Tipo de reserva' : 'Escolha o serviço'}</CardTitle></CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {services.length === 0 && <p className="text-muted-foreground text-sm">Esta empresa ainda não tem serviços disponíveis.</p>}
            {services.map((s) => (
              <button key={s.id} onClick={() => setServiceId(s.id)} className={`text-left rounded-lg border p-3 transition ${serviceId === s.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted'}`}>
                <div className="font-medium">{s.name}</div>
                <div className="text-sm text-muted-foreground">{s.duration} min · {eur(s.price)}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        {service && (
          <Card>
            <CardHeader><CardTitle className="text-lg">2. Dia e hora</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {isRestaurant && (
                <div className="flex items-center gap-3"><Users className="h-4 w-4" /><span className="text-sm">Pessoas</span>
                  <Button size="icon" variant="outline" onClick={() => setParty(Math.max(1, party - 1))}><Minus className="h-4 w-4" /></Button>
                  <span className="w-6 text-center font-semibold">{party}</span>
                  <Button size="icon" variant="outline" onClick={() => setParty(Math.min(30, party + 1))}><Plus className="h-4 w-4" /></Button>
                </div>
              )}
              <div className="flex justify-center"><Calendar mode="single" selected={date} onSelect={setDate} locale={pt} disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} className="rounded-md border" /></div>
              {date && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {slots.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Sem horários neste dia.</p>}
                  {slots.map(({ t, ok }) => (
                    <Button key={t.toISOString()} size="sm" disabled={!ok} variant={time?.getTime() === t.getTime() ? 'default' : 'outline'} onClick={() => setTime(t)} className={!ok ? 'line-through' : ''}>{format(t, 'HH:mm')}</Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {time && products.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">3. Juntar à reserva (opcional)</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {products.map((p) => {
                const v = (p.product_variants || []).find((x) => x.stock > 0)!;
                const q = extras[v.id] || 0;
                const img = productImages(p)[0];
                return (
                  <div key={p.id} className="flex items-center gap-3 border rounded-lg p-2">
                    {img ? <img src={img} alt="" className="h-12 w-12 rounded object-cover" /> : <div className="h-12 w-12 rounded bg-muted" />}
                    <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{p.name}</div><div className="text-xs text-muted-foreground">{eur(variantPrice(p, v))}</div></div>
                    <Button size="icon" variant="outline" className="h-8 w-8" disabled={!q} onClick={() => setExtras({ ...extras, [v.id]: q - 1 })}><Minus className="h-3 w-3" /></Button>
                    <span className="w-4 text-center text-sm">{q}</span>
                    <Button size="icon" variant="outline" className="h-8 w-8" disabled={q >= v.stock} onClick={() => setExtras({ ...extras, [v.id]: q + 1 })}><Plus className="h-3 w-3" /></Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {time && (
          <Card>
            <CardHeader><CardTitle className="text-lg">{products.length ? 4 : 3}. Os seus dados</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {!userId && <div className="rounded-md bg-muted p-3 text-sm flex items-center justify-between gap-2">Inicie sessão para confirmar.<Button size="sm" onClick={() => setAuthOpen(true)}>Entrar</Button></div>}
              <div className="grid gap-3 sm:grid-cols-3">
                <div><Label>Nome</Label><Input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></div>
                <div><Label>Telefone</Label><Input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></div>
              </div>
              <Separator />
              <div className="text-sm space-y-1">
                <div className="flex justify-between"><span>{service?.name}</span><span>{eur(service?.price)}</span></div>
                {extrasTotal > 0 && <div className="flex justify-between"><span>Produtos</span><span>{eur(extrasTotal)}</span></div>}
                {deposit > 0 && <div className="flex justify-between font-semibold text-primary"><span>Sinal a pagar agora</span><span>{eur(deposit)}</span></div>}
                {settings && <p className="text-xs text-muted-foreground pt-1">Cancelamento grátis até {settings.cancel_hours}h antes. Pagamentos em modo de teste.</p>}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {time && (
        <div className="fixed bottom-0 inset-x-0 bg-background border-t p-3">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <div className="text-sm min-w-0"><div className="font-medium truncate">{format(time, "d MMM, HH:mm", { locale: pt })}</div><div className="text-muted-foreground">Pagar agora: {eur(deposit + extrasTotal)}</div></div>
            <Button className="ml-auto" size="lg" onClick={confirm} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmar</Button>
          </div>
        </div>
      )}
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};

export default Schedule;
