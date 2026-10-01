import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useCompany } from '@/context/CompanyContext';
import { db, eur } from '@/lib/shop';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { AlertTriangle, PackageX, ShoppingBag, Scissors, Wallet } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { Link } from 'react-router-dom';

const RANGES = [7, 30, 90];

const Reports: React.FC = () => {
  const { company } = useCompany();
  const [days, setDays] = useState(30);
  const [orders, setOrders] = useState<any[]>([]);
  const [appts, setAppts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!company.id) return;
    const from = startOfDay(subDays(new Date(), days - 1)).toISOString();
    Promise.all([
      db.from('orders').select('total, created_at, status, order_items(product_name, quantity, unit_price)').eq('company_id', company.id).gte('created_at', from).neq('status', 'cancelled'),
      db.from('appointments').select('service_price, appointment_date, status').eq('company_id', company.id).gte('appointment_date', from).neq('status', 'cancelled'),
      db.from('products').select('id, name, low_stock_threshold, product_variants(id, name, stock)').eq('company_id', company.id),
    ]).then(([o, a, p]) => {
      setOrders(o.data || []);
      setAppts((a.data || []).filter((x: any) => new Date(x.appointment_date) <= new Date()));
      setProducts(p.data || []);
    });
  }, [company.id, days]);

  const productRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const serviceRevenue = appts.reduce((s, a) => s + Number(a.service_price || 0), 0);

  const chart = useMemo(() => {
    const map: Record<string, { day: string; Produtos: number; Serviços: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'dd/MM');
      map[d] = { day: d, Produtos: 0, Serviços: 0 };
    }
    orders.forEach((o) => { const d = format(new Date(o.created_at), 'dd/MM'); if (map[d]) map[d].Produtos += Number(o.total); });
    appts.forEach((a) => { const d = format(new Date(a.appointment_date), 'dd/MM'); if (map[d]) map[d].Serviços += Number(a.service_price || 0); });
    return Object.values(map);
  }, [orders, appts, days]);

  const top = useMemo(() => {
    const m: Record<string, { name: string; qty: number; revenue: number }> = {};
    orders.forEach((o) => o.order_items?.forEach((i: any) => {
      m[i.product_name] ??= { name: i.product_name, qty: 0, revenue: 0 };
      m[i.product_name].qty += i.quantity;
      m[i.product_name].revenue += i.quantity * Number(i.unit_price);
    }));
    return Object.values(m).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);

  const alerts = products.flatMap((p) => (p.product_variants || [])
    .filter((v: any) => v.stock <= p.low_stock_threshold)
    .map((v: any) => ({ product: p.name, variant: v.name, stock: v.stock })))
    .sort((a, b) => a.stock - b.stock);

  const stat = (icon: React.ReactNode, label: string, value: string) => (
    <Card><CardContent className="p-4 flex items-center gap-3">
      <div className="p-2 rounded-md bg-primary/10 text-primary">{icon}</div>
      <div><p className="text-sm text-muted-foreground">{label}</p><p className="text-xl font-bold">{value}</p></div>
    </CardContent></Card>
  );

  return (
    <DashboardLayout title="Financeiro & Inventário">
      <div className="flex gap-2 mb-4">
        {RANGES.map((r) => <Button key={r} size="sm" variant={r === days ? 'default' : 'outline'} onClick={() => setDays(r)}>{r} dias</Button>)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        {stat(<Wallet className="h-5 w-5" />, 'Receita total', eur(productRevenue + serviceRevenue))}
        {stat(<ShoppingBag className="h-5 w-5" />, 'Vendas de produtos', eur(productRevenue))}
        {stat(<Scissors className="h-5 w-5" />, 'Serviços / reservas', eur(serviceRevenue))}
        {stat(<ShoppingBag className="h-5 w-5" />, 'Encomendas', String(orders.length))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Receita por dia: produtos vs. serviços</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => eur(v)} />
                <Legend />
                <Bar dataKey="Produtos" stackId="a" fill="hsl(var(--primary))" />
                <Bar dataKey="Serviços" stackId="a" fill="hsl(var(--primary) / 0.45)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Produtos mais vendidos</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {top.length === 0 ? <p className="text-sm text-muted-foreground">Sem vendas no período.</p> : top.map((t) => (
              <div key={t.name} className="flex justify-between text-sm"><span>{t.name} <span className="text-muted-foreground">×{t.qty}</span></span><span className="font-medium">{eur(t.revenue)}</span></div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Alertas de inventário</CardTitle>
          <Link to="/products" className="text-sm text-primary underline">Gerir produtos</Link>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? <p className="text-sm text-muted-foreground">Todo o stock está em níveis saudáveis.</p> : (
            <div className="divide-y">
              {alerts.map((a, i) => (
                <div key={i} className="flex justify-between py-2 text-sm">
                  <span>{a.product}{a.variant !== 'Único' && <span className="text-muted-foreground"> · {a.variant}</span>}</span>
                  {a.stock === 0
                    ? <Badge variant="destructive"><PackageX className="h-3 w-3 mr-1" />Esgotado</Badge>
                    : <Badge variant="outline" className="border-destructive text-destructive">Stock crítico: {a.stock}</Badge>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Reports;
