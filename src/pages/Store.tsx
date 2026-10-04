import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { db, eur, loadSettings, CompanySettings, Product, Variant, productImages, productStock, variantPrice, useCart } from '@/lib/shop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import Logo from '@/components/common/Logo';
import { ShoppingCart, Minus, Plus, Trash2, Loader2, Truck, Store as StoreIcon, CheckCircle2, CalendarDays, User } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const checkoutSchema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(120),
  email: z.string().trim().email('Email inválido').max(255),
  phone: z.string().trim().min(6, 'Telefone inválido').max(40),
  nif: z.string().trim().regex(/^(\d{9})?$/, 'NIF deve ter 9 dígitos').optional(),
});

const Store: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [hasServices, setHasServices] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<string>('all');
  const [view, setView] = useState<Product | null>(null);
  const [variant, setVariant] = useState<Variant | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [step, setStep] = useState<'cart' | 'checkout' | 'done'>('cart');
  const [method, setMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [form, setForm] = useState({ name: '', email: '', phone: '', street: '', postal_code: '', city: '', nif: '', notes: '' });
  const [sameBilling, setSameBilling] = useState(true);
  const [billing, setBilling] = useState({ street: '', postal_code: '', city: '' });
  const [placing, setPlacing] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const cart = useCart(id);

  const load = async () => {
    if (!id) return;
    const [{ data: c }, { data: p }, s, { count }] = await Promise.all([
      supabase.from('companies').select('id, name, segment, address, phone, avatar_url').eq('id', id).maybeSingle(),
      db.from('products').select('*, product_images(*), product_variants(*)').eq('company_id', id).eq('active', true).order('created_at', { ascending: false }),
      loadSettings(id),
      supabase.from('services').select('id', { count: 'exact', head: true }).eq('company_id', id),
    ]);
    setCompany(c); setProducts(p || []); setSettings(s); setHasServices((count || 0) > 0);
    setMethod(s.delivery_enabled ? 'delivery' : 'pickup');
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user;
      if (!u) return;
      setUserId(u.id);
      const { data: cu } = await supabase.from('customers').select('*').eq('user_id', u.id).maybeSingle();
      setForm((f) => ({ ...f, name: cu?.name || f.name, email: cu?.email || u.email || f.email, phone: cu?.phone || f.phone, street: cu?.address || f.street }));
    });
  }, []);

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[], [products]);
  const shown = cat === 'all' ? products : products.filter((p) => p.category === cat);

  const openProduct = (p: Product) => {
    setView(p); setImgIdx(0); setQty(1);
    setVariant((p.product_variants || []).find((v) => v.stock > 0) || p.product_variants?.[0] || null);
  };

  const addToCart = () => {
    if (!view || !variant) return;
    const inCart = cart.items.find((i) => i.variant_id === variant.id)?.quantity || 0;
    if (inCart + qty > variant.stock) return toast.error(`Só há ${variant.stock} em stock`);
    cart.add({ variant_id: variant.id, product_id: view.id, name: view.name, variant_name: variant.name, price: variantPrice(view, variant), image: productImages(view)[0], quantity: qty, max: variant.stock });
    toast.success('Adicionado ao carrinho');
    setView(null);
  };

  const fee = method === 'delivery' && settings
    ? (settings.free_shipping_over != null && cart.subtotal >= settings.free_shipping_over ? 0 : Number(settings.shipping_fee))
    : 0;

  const placeOrder = async () => {
    const parsed = checkoutSchema.safeParse({ name: form.name, email: form.email, phone: form.phone, nif: form.nif });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (method === 'delivery' && (!form.street.trim() || !form.postal_code.trim() || !form.city.trim()))
      return toast.error('Preencha a morada de envio completa');
    setPlacing(true);
    const shipping = method === 'delivery' ? { street: form.street.trim(), postal_code: form.postal_code.trim(), city: form.city.trim(), country: 'Portugal' } : null;
    const bill = sameBilling ? shipping : { ...billing, country: 'Portugal' };
    const { data, error } = await db.rpc('place_order', {
      p_company_id: id,
      p_items: cart.items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity })),
      p_delivery_method: method,
      p_customer: { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() },
      p_shipping: shipping, p_billing: bill, p_nif: form.nif.trim() || null, p_notes: form.notes.trim() || null,
    });
    setPlacing(false);
    if (error) { toast.error('Não foi possível concluir', { description: error.message }); load(); return; }
    cart.clear(); setDoneId(data); setStep('done'); load();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!company) return <div className="min-h-screen flex flex-col items-center justify-center gap-3"><p>Loja não encontrada</p><Button onClick={() => navigate('/search')}>Voltar</Button></div>;

  const images = view ? productImages(view) : [];

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-background border-b sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/search"><Logo /></Link>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => navigate(userId ? '/conta' : '/customer/auth')}><User className="h-4 w-4 mr-1" />{userId ? 'A minha conta' : 'Entrar'}</Button>
          </div>
        </div>
      </header>

      <section className="bg-background border-b">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-wrap items-center gap-4">
          {company.avatar_url && <img src={company.avatar_url} alt={company.name} className="h-16 w-16 rounded-full object-cover border-2 border-foreground" />}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <p className="text-sm text-muted-foreground">{company.address}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {settings?.delivery_enabled && <Badge variant="outline"><Truck className="h-3 w-3 mr-1" />Envio {settings.free_shipping_over != null ? `grátis acima de ${eur(settings.free_shipping_over)}` : eur(settings.shipping_fee)}</Badge>}
              {settings?.pickup_enabled && <Badge variant="outline"><StoreIcon className="h-3 w-3 mr-1" />Recolha na loja</Badge>}
            </div>
          </div>
          {hasServices && <Button onClick={() => navigate(`/schedule/${company.id}`)}><CalendarDays className="h-4 w-4 mr-1" />{company.segment === 'restaurante' ? 'Reservar mesa' : 'Agendar serviço'}</Button>}
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {categories.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            <Button size="sm" variant={cat === 'all' ? 'default' : 'outline'} onClick={() => setCat('all')}>Tudo</Button>
            {categories.map((c) => <Button key={c} size="sm" variant={cat === c ? 'default' : 'outline'} onClick={() => setCat(c)}>{c}</Button>)}
          </div>
        )}
        {shown.length === 0 ? (
          <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground bg-background">Esta loja ainda não tem produtos à venda.</div>
        ) : (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {shown.map((p) => {
              const stock = productStock(p);
              const img = productImages(p)[0];
              return (
                <button key={p.id} onClick={() => openProduct(p)} className="bg-background border rounded-lg overflow-hidden text-left hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-muted relative">
                    {img && <img src={img} alt={p.name} loading="lazy" className="w-full h-full object-cover" />}
                    {stock === 0 && <Badge variant="destructive" className="absolute top-2 left-2">Esgotado</Badge>}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm line-clamp-2">{p.name}</p>
                    <p className="font-bold mt-1">{eur(p.price)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Carrinho flutuante */}
      <button onClick={() => { setStep('cart'); setCartOpen(true); }} aria-label="Abrir carrinho"
        className="fixed bottom-5 right-5 z-30 bg-primary text-primary-foreground rounded-full shadow-lg px-5 py-3 flex items-center gap-2">
        <ShoppingCart className="h-5 w-5" />
        <span className="font-semibold">{cart.count}</span>
        {cart.count > 0 && <span className="hidden sm:inline">· {eur(cart.subtotal)}</span>}
      </button>

      {/* Detalhe do produto */}
      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {view && (
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  {images[imgIdx] && <img src={images[imgIdx]} alt={view.name} className="w-full h-full object-cover" />}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto">
                    {images.map((u, i) => (
                      <button key={u} onClick={() => setImgIdx(i)} className={`h-14 w-14 rounded border-2 overflow-hidden shrink-0 ${i === imgIdx ? 'border-primary' : 'border-transparent'}`}>
                        <img src={u} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <DialogHeader><DialogTitle className="text-xl">{view.name}</DialogTitle></DialogHeader>
                <p className="text-2xl font-bold">{eur(variantPrice(view, variant))}</p>
                {view.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{view.description}</p>}
                {(view.product_variants?.length || 0) > 1 && (
                  <div>
                    <Label>Opção</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {view.product_variants!.map((v) => (
                        <Button key={v.id} size="sm" variant={variant?.id === v.id ? 'default' : 'outline'} disabled={v.stock === 0} onClick={() => { setVariant(v); setQty(1); }}>
                          {v.name}{v.stock === 0 && ' (esgotado)'}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {variant && (
                  <p className="text-sm">{variant.stock === 0 ? <span className="text-destructive">Esgotado</span> : variant.stock <= view.low_stock_threshold ? <span className="text-destructive">Últimas {variant.stock} unidades</span> : <span className="text-muted-foreground">Em stock</span>}</p>
                )}
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></Button>
                  <span className="w-8 text-center font-medium">{qty}</span>
                  <Button size="icon" variant="outline" onClick={() => setQty(Math.min(variant?.stock || 1, qty + 1))}><Plus className="h-4 w-4" /></Button>
                </div>
                <Button size="lg" disabled={!variant || variant.stock === 0} onClick={addToCart} className="mt-auto"><ShoppingCart className="h-4 w-4 mr-2" />Adicionar ao carrinho</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Carrinho + checkout */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto flex flex-col">
          <SheetHeader><SheetTitle>{step === 'cart' ? 'O seu carrinho' : step === 'checkout' ? 'Finalizar compra' : 'Encomenda confirmada'}</SheetTitle></SheetHeader>

          {step === 'done' ? (
            <div className="flex flex-col items-center text-center gap-3 py-10">
              <CheckCircle2 className="h-14 w-14 text-primary" />
              <p className="font-semibold text-lg">Obrigado pela sua compra!</p>
              <p className="text-sm text-muted-foreground">Referência: {doneId?.slice(0, 8).toUpperCase()}. Pagamento simulado (versão de teste). Receberá atualizações do estado da encomenda.</p>
              {userId && <Button onClick={() => navigate('/conta')}>Acompanhar encomenda</Button>}
              <Button variant="outline" onClick={() => setCartOpen(false)}>Continuar a comprar</Button>
            </div>
          ) : cart.items.length === 0 ? (
            <p className="text-muted-foreground text-sm py-10 text-center">O carrinho está vazio.</p>
          ) : step === 'cart' ? (
            <>
              <div className="divide-y flex-1">
                {cart.items.map((i) => (
                  <div key={i.variant_id} className="py-3 flex gap-3">
                    <div className="h-16 w-16 bg-muted rounded overflow-hidden shrink-0">{i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{i.name}</p>
                      {i.variant_name !== 'Único' && <p className="text-xs text-muted-foreground">{i.variant_name}</p>}
                      <div className="flex items-center gap-1 mt-1">
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => cart.setQty(i.variant_id, i.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                        <span className="w-6 text-center text-sm">{i.quantity}</span>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => cart.setQty(i.variant_id, i.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 ml-auto" onClick={() => cart.remove(i.variant_id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    <p className="text-sm font-semibold">{eur(i.price * i.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t pt-3">
                <Label>Entrega</Label>
                <div className="grid grid-cols-2 gap-2">
                  {settings?.delivery_enabled && <Button variant={method === 'delivery' ? 'default' : 'outline'} onClick={() => setMethod('delivery')}><Truck className="h-4 w-4 mr-1" />Envio</Button>}
                  {settings?.pickup_enabled && <Button variant={method === 'pickup' ? 'default' : 'outline'} onClick={() => setMethod('pickup')}><StoreIcon className="h-4 w-4 mr-1" />Recolha</Button>}
                </div>
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>{eur(cart.subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span>Portes</span><span>{fee === 0 ? 'Grátis' : eur(fee)}</span></div>
                <div className="flex justify-between font-bold"><span>Total</span><span>{eur(cart.subtotal + fee)}</span></div>
                <Button className="w-full" size="lg" onClick={() => setStep('checkout')}>Finalizar compra</Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={form.name} maxLength={120} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Email</Label><Input type="email" value={form.email} maxLength={255} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>Telefone</Label><Input value={form.phone} maxLength={40} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              {method === 'delivery' && (
                <>
                  <div><Label>Morada de envio</Label><Input value={form.street} maxLength={200} onChange={(e) => setForm({ ...form, street: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Código postal</Label><Input placeholder="0000-000" value={form.postal_code} maxLength={10} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} /></div>
                    <div><Label>Localidade</Label><Input value={form.city} maxLength={80} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                  </div>
                  <label className="flex items-center gap-2 text-sm"><Checkbox checked={sameBilling} onCheckedChange={(c) => setSameBilling(!!c)} />Faturação igual à morada de envio</label>
                </>
              )}
              {(method === 'pickup' || !sameBilling) && (
                <div className="space-y-2">
                  <Label>Morada de faturação (opcional)</Label>
                  <Input placeholder="Rua" value={billing.street} maxLength={200} onChange={(e) => setBilling({ ...billing, street: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Código postal" value={billing.postal_code} maxLength={10} onChange={(e) => setBilling({ ...billing, postal_code: e.target.value })} />
                    <Input placeholder="Localidade" value={billing.city} maxLength={80} onChange={(e) => setBilling({ ...billing, city: e.target.value })} />
                  </div>
                </div>
              )}
              <div><Label>NIF (opcional)</Label><Input inputMode="numeric" value={form.nif} maxLength={9} onChange={(e) => setForm({ ...form, nif: e.target.value.replace(/\D/g, '') })} /></div>
              <div><Label>Notas</Label><Textarea rows={2} maxLength={1000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              {!userId && <p className="text-xs text-muted-foreground"><Link to="/customer/auth" className="text-primary underline">Entre na sua conta</Link> para acompanhar a encomenda em tempo real.</p>}
              <div className="border-t pt-3 flex justify-between font-bold"><span>Total a pagar</span><span>{eur(cart.subtotal + fee)}</span></div>
              <p className="text-xs text-muted-foreground">Versão de teste: o pagamento é simulado.</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('cart')}>Voltar</Button>
                <Button className="flex-1" disabled={placing} onClick={placeOrder}>{placing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Pagar e confirmar</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Store;
