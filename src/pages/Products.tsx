import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useCompany } from '@/context/CompanyContext';
import { db, eur, Product, productImages, productStock, uploadProductImage } from '@/lib/shop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, ImagePlus, Loader2, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

type VariantDraft = { id?: string; name: string; price_override: string; stock: string };
type Draft = {
  id?: string;
  name: string;
  description: string;
  category: string;
  price: string;
  low_stock_threshold: string;
  active: boolean;
  images: string[];
  variants: VariantDraft[];
};

const empty: Draft = {
  name: '', description: '', category: '', price: '', low_stock_threshold: '5', active: true, images: [],
  variants: [{ name: 'Único', price_override: '', stock: '10' }],
};

const schema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(120),
  description: z.string().max(3000),
  price: z.number().min(0, 'Preço inválido'),
});

const Products: React.FC = () => {
  const { company } = useCompany();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    if (!company.id) return;
    setLoading(true);
    const { data } = await db
      .from('products')
      .select('*, product_images(*), product_variants(*)')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [company.id]);

  const edit = (p: Product) =>
    setDraft({
      id: p.id, name: p.name, description: p.description || '', category: p.category || '',
      price: String(p.price), low_stock_threshold: String(p.low_stock_threshold), active: p.active,
      images: productImages(p),
      variants: (p.product_variants || []).map((v) => ({ id: v.id, name: v.name, price_override: v.price_override?.toString() || '', stock: String(v.stock) })),
    });

  const onFiles = async (files: FileList | null) => {
    if (!files || !draft) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name}: máximo 5MB`); continue; }
        urls.push(await uploadProductImage(f));
      }
      setDraft((d) => d && { ...d, images: [...d.images, ...urls] });
    } catch (e: any) {
      toast.error('Erro ao enviar foto', { description: e.message });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!draft || !company.id) return;
    const parsed = schema.safeParse({ name: draft.name, description: draft.description, price: Number(draft.price) });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (draft.variants.length === 0) return toast.error('Adicione pelo menos uma variante');
    setSaving(true);
    try {
      const payload = {
        company_id: company.id, name: draft.name.trim(), description: draft.description.trim() || null,
        category: draft.category.trim() || null, price: Number(draft.price),
        low_stock_threshold: Math.max(0, parseInt(draft.low_stock_threshold) || 0), active: draft.active,
      };
      let productId = draft.id;
      if (productId) {
        const { error } = await db.from('products').update(payload).eq('id', productId);
        if (error) throw error;
      } else {
        const { data, error } = await db.from('products').insert(payload).select('id').single();
        if (error) throw error;
        productId = data.id;
      }
      await db.from('product_images').delete().eq('product_id', productId);
      if (draft.images.length)
        await db.from('product_images').insert(draft.images.map((url, i) => ({ product_id: productId, url, position: i })));

      const keepIds = draft.variants.filter((v) => v.id).map((v) => v.id);
      const original = products.find((p) => p.id === productId)?.product_variants || [];
      const removed = original.filter((v) => !keepIds.includes(v.id)).map((v) => v.id);
      if (removed.length) await db.from('product_variants').delete().in('id', removed);
      for (const v of draft.variants) {
        const row = {
          product_id: productId, name: v.name.trim() || 'Único',
          price_override: v.price_override === '' ? null : Number(v.price_override),
          stock: Math.max(0, parseInt(v.stock) || 0),
        };
        const { error } = v.id
          ? await db.from('product_variants').update(row).eq('id', v.id)
          : await db.from('product_variants').insert(row);
        if (error) throw error;
      }
      toast.success('Produto guardado');
      setDraft(null);
      load();
    } catch (e: any) {
      toast.error('Erro ao guardar', { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`Eliminar "${p.name}"?`)) return;
    const { error } = await db.from('products').delete().eq('id', p.id);
    if (error) return toast.error(error.message);
    setProducts((ps) => ps.filter((x) => x.id !== p.id));
    toast.success('Produto eliminado');
  };

  const setVar = (i: number, patch: Partial<VariantDraft>) =>
    setDraft((d) => d && { ...d, variants: d.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)) });

  return (
    <DashboardLayout title="Produtos da Loja">
      <div className="flex justify-between items-center mb-4">
        <p className="text-muted-foreground text-sm">{products.length} produtos no catálogo</p>
        <Button onClick={() => setDraft({ ...empty, variants: [...empty.variants] })}><Plus className="h-4 w-4 mr-1" /> Novo produto</Button>
      </div>

      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : products.length === 0 ? (
        <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground bg-background">
          Ainda não tem produtos. Crie o primeiro para começar a vender online.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => {
            const stock = productStock(p);
            const img = productImages(p)[0];
            return (
              <div key={p.id} className="bg-background border rounded-lg overflow-hidden flex flex-col">
                <div className="aspect-[4/3] bg-muted">
                  {img && <img src={img} alt={p.name} className="w-full h-full object-cover" />}
                </div>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <div className="flex justify-between gap-2">
                    <h3 className="font-semibold">{p.name}</h3>
                    <span className="font-semibold">{eur(p.price)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {!p.active && <Badge variant="secondary">Oculto</Badge>}
                    {stock === 0 ? <Badge variant="destructive">Esgotado</Badge>
                      : stock <= p.low_stock_threshold ? <Badge className="bg-accent text-accent-foreground">Stock crítico: {stock}</Badge>
                      : <Badge variant="outline">Stock: {stock}</Badge>}
                    <Badge variant="outline">{p.product_variants?.length || 0} variantes</Badge>
                  </div>
                  <div className="flex gap-2 mt-auto pt-2">
                    <Button size="sm" variant="outline" onClick={() => edit(p)}><Pencil className="h-4 w-4 mr-1" />Editar</Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{draft?.id ? 'Editar produto' : 'Novo produto'}</DialogTitle></DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Nome</Label><Input value={draft.name} maxLength={120} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
                <div><Label>Categoria</Label><Input value={draft.category} maxLength={60} onChange={(e) => setDraft({ ...draft, category: e.target.value })} /></div>
                <div><Label>Preço base (€)</Label><Input type="number" step="0.01" min="0" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /></div>
                <div><Label>Alerta de stock crítico (≤)</Label><Input type="number" min="0" value={draft.low_stock_threshold} onChange={(e) => setDraft({ ...draft, low_stock_threshold: e.target.value })} /></div>
              </div>
              <div><Label>Descrição</Label><Textarea rows={4} maxLength={3000} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>

              <div>
                <Label>Fotos</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {draft.images.map((url, i) => (
                    <div key={url} className="relative h-20 w-20 rounded-md overflow-hidden border">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button type="button" className="absolute top-0.5 right-0.5 bg-background/90 rounded-full p-0.5"
                        onClick={() => setDraft({ ...draft, images: draft.images.filter((_, j) => j !== i) })}><X className="h-3 w-3" /></button>
                      {i === 0 && <span className="absolute bottom-0 inset-x-0 text-[10px] text-center bg-primary text-primary-foreground">Capa</span>}
                    </div>
                  ))}
                  <label className="h-20 w-20 border border-dashed rounded-md flex items-center justify-center cursor-pointer hover:bg-muted">
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5 text-muted-foreground" />}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
                  </label>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label>Variantes (tamanho / cor) e stock</Label>
                  <Button size="sm" variant="outline" type="button" onClick={() => setDraft({ ...draft, variants: [...draft.variants, { name: '', price_override: '', stock: '0' }] })}>
                    <Plus className="h-3 w-3 mr-1" />Variante
                  </Button>
                </div>
                <div className="space-y-2">
                  {draft.variants.map((v, i) => (
                    <div key={i} className="grid grid-cols-[1fr_100px_80px_auto] gap-2 items-center">
                      <Input placeholder="Ex: M / Azul" value={v.name} maxLength={60} onChange={(e) => setVar(i, { name: e.target.value })} />
                      <Input placeholder="Preço" type="number" step="0.01" value={v.price_override} onChange={(e) => setVar(i, { price_override: e.target.value })} />
                      <Input placeholder="Stock" type="number" min="0" value={v.stock} onChange={(e) => setVar(i, { stock: e.target.value })} />
                      <Button size="icon" variant="ghost" type="button" onClick={() => setDraft({ ...draft, variants: draft.variants.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">Preço vazio = usa o preço base.</p>
                </div>
              </div>

              <div className="flex items-center gap-2"><Switch checked={draft.active} onCheckedChange={(c) => setDraft({ ...draft, active: c })} /><Label>Visível na loja</Label></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || uploading}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Products;
