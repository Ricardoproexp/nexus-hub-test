import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const db = supabase as any;

export const eur = (v: number | null | undefined) =>
  Number(v || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

export const ORDER_STATUSES = [
  { value: 'new', label: 'Novos' },
  { value: 'preparing', label: 'Em Separação' },
  { value: 'shipped', label: 'Enviados/Prontos' },
  { value: 'completed', label: 'Concluídos' },
  { value: 'cancelled', label: 'Cancelados' },
] as const;

export const STATUS_LABEL: Record<string, string> = {
  new: 'Recebida',
  preparing: 'Em separação',
  shipped: 'Enviada / Pronta',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

export const PROGRESS_STEPS = ['new', 'preparing', 'shipped', 'completed'];

export const CARRIERS = ['CTT', 'CTT Expresso', 'DPD', 'GLS', 'UPS', 'SEUR', 'Outra'];

export type CompanySettings = {
  company_id: string;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  shipping_fee: number;
  free_shipping_over: number | null;
  deposit_mode: 'none' | 'percent' | 'fixed' | 'full';
  deposit_value: number;
  cancel_hours: number;
  open_hour: number;
  close_hour: number;
  slot_minutes: number;
  tables_count: number;
};

export const DEFAULT_SETTINGS: Omit<CompanySettings, 'company_id'> = {
  delivery_enabled: true,
  pickup_enabled: true,
  shipping_fee: 4.99,
  free_shipping_over: null,
  deposit_mode: 'none',
  deposit_value: 0,
  cancel_hours: 24,
  open_hour: 8,
  close_hour: 20,
  slot_minutes: 30,
  tables_count: 10,
};

export async function loadSettings(companyId: string): Promise<CompanySettings> {
  const { data } = await db.from('company_settings').select('*').eq('company_id', companyId).maybeSingle();
  return { company_id: companyId, ...DEFAULT_SETTINGS, ...(data || {}) };
}

export function computeDeposit(s: CompanySettings, price: number) {
  if (s.deposit_mode === 'full') return price;
  if (s.deposit_mode === 'percent') return Math.round(price * s.deposit_value) / 100;
  if (s.deposit_mode === 'fixed') return Math.min(price || s.deposit_value, s.deposit_value);
  return 0;
}

export type Variant = { id: string; product_id: string; name: string; price_override: number | null; stock: number };
export type Product = {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  active: boolean;
  low_stock_threshold: number;
  product_images?: { id: string; url: string; position: number }[];
  product_variants?: Variant[];
};

export const productImages = (p: Product) =>
  [...(p.product_images || [])].sort((a, b) => a.position - b.position).map((i) => i.url);
export const productStock = (p: Product) => (p.product_variants || []).reduce((s, v) => s + v.stock, 0);
export const variantPrice = (p: Product, v?: Variant | null) => Number(v?.price_override ?? p.price);

export async function uploadProductImage(file: File): Promise<string> {
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) throw new Error('Sessão expirada');
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${uid}/products/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('company-avatars').upload(path, file, { upsert: false });
  if (error) throw error;
  return supabase.storage.from('company-avatars').getPublicUrl(path).data.publicUrl;
}

// ---- Cart (per company, localStorage) ----
export type CartItem = {
  variant_id: string;
  product_id: string;
  name: string;
  variant_name: string;
  price: number;
  image?: string;
  quantity: number;
  max: number;
};

export function useCart(companyId?: string) {
  const key = `nexushub_cart_${companyId}`;
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (!companyId) return;
    try {
      setItems(JSON.parse(localStorage.getItem(key) || '[]'));
    } catch {
      setItems([]);
    }
  }, [key, companyId]);

  const persist = useCallback(
    (next: CartItem[]) => {
      setItems(next);
      localStorage.setItem(key, JSON.stringify(next));
    },
    [key]
  );

  const add = (item: CartItem) => {
    const existing = items.find((i) => i.variant_id === item.variant_id);
    if (existing) {
      persist(items.map((i) => (i.variant_id === item.variant_id ? { ...i, quantity: Math.min(i.max, i.quantity + item.quantity) } : i)));
    } else persist([...items, { ...item, quantity: Math.min(item.max, item.quantity) }]);
  };
  const setQty = (variantId: string, q: number) =>
    persist(items.map((i) => (i.variant_id === variantId ? { ...i, quantity: Math.max(1, Math.min(i.max, q)) } : i)));
  const remove = (variantId: string) => persist(items.filter((i) => i.variant_id !== variantId));
  const clear = () => persist([]);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return { items, add, setQty, remove, clear, subtotal, count };
}

export function playChime() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      o.connect(g);
      g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.start(t);
      o.stop(t + 0.32);
    });
  } catch {
    /* ignore */
  }
}
