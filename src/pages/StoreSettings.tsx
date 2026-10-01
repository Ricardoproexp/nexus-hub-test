import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useCompany } from '@/context/CompanyContext';
import { db, loadSettings, CompanySettings } from '@/lib/shop';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const StoreSettings: React.FC = () => {
  const { company } = useCompany();
  const [s, setS] = useState<CompanySettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (company.id) loadSettings(company.id).then(setS); }, [company.id]);

  const num = (k: keyof CompanySettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setS((p) => p && { ...p, [k]: e.target.value === '' ? null : Number(e.target.value) });

  const save = async () => {
    if (!s) return;
    if (!s.delivery_enabled && !s.pickup_enabled) return toast.error('Ative pelo menos um método de entrega');
    if (s.close_hour <= s.open_hour) return toast.error('A hora de fecho deve ser depois da abertura');
    setSaving(true);
    const { error } = await db.from('company_settings').upsert(s);
    setSaving(false);
    error ? toast.error(error.message) : toast.success('Definições guardadas');
  };

  return (
    <DashboardLayout title="Definições da Loja">
      {!s ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : (
        <div className="grid gap-4 lg:grid-cols-2 max-w-5xl">
          <Card>
            <CardHeader><CardTitle className="text-base">Entregas</CardTitle><CardDescription>Como os clientes recebem as compras.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2"><Switch checked={s.delivery_enabled} onCheckedChange={(c) => setS({ ...s, delivery_enabled: c })} /><Label>Envio ao domicílio</Label></div>
              <div className="flex items-center gap-2"><Switch checked={s.pickup_enabled} onCheckedChange={(c) => setS({ ...s, pickup_enabled: c })} /><Label>Recolha na loja / Takeaway</Label></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Portes (€)</Label><Input type="number" step="0.01" min="0" value={s.shipping_fee ?? ''} onChange={num('shipping_fee')} /></div>
                <div><Label>Portes grátis acima de (€)</Label><Input type="number" step="0.01" min="0" placeholder="Nunca" value={s.free_shipping_over ?? ''} onChange={num('free_shipping_over')} /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Pagamento na reserva</CardTitle><CardDescription>Cobre um sinal para reduzir faltas.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Tipo de cobrança</Label>
                <Select value={s.deposit_mode} onValueChange={(v: any) => setS({ ...s, deposit_mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem pagamento antecipado</SelectItem>
                    <SelectItem value="percent">Sinal em percentagem (%)</SelectItem>
                    <SelectItem value="fixed">Sinal de valor fixo (€)</SelectItem>
                    <SelectItem value="full">Valor total</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(s.deposit_mode === 'percent' || s.deposit_mode === 'fixed') && (
                <div><Label>{s.deposit_mode === 'percent' ? 'Percentagem (%)' : 'Valor (€)'}</Label><Input type="number" min="0" value={s.deposit_value} onChange={num('deposit_value')} /></div>
              )}
              <div><Label>Cancelamento grátis até (horas antes)</Label><Input type="number" min="0" value={s.cancel_hours} onChange={num('cancel_hours')} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Horário e capacidade</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div><Label>Abre (hora)</Label><Input type="number" min="0" max="23" value={s.open_hour} onChange={num('open_hour')} /></div>
              <div><Label>Fecha (hora)</Label><Input type="number" min="1" max="24" value={s.close_hour} onChange={num('close_hour')} /></div>
              <div><Label>Intervalo entre horários (min)</Label><Input type="number" min="10" step="5" value={s.slot_minutes} onChange={num('slot_minutes')} /></div>
              {company.segment === 'restaurante' && (
                <div><Label>Número de mesas</Label><Input type="number" min="1" value={s.tables_count} onChange={num('tables_count')} /></div>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-2"><Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Guardar definições</Button></div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StoreSettings;
