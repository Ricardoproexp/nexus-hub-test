import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';
import { useCompany } from '@/context/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { eur, playChime } from '@/lib/shop';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const DashboardLayout: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => {
  const [open, setOpen] = useState(false);
  const { company } = useCompany();
  const navigate = useNavigate();

  useEffect(() => {
    if (!company.id) return;
    const channel = supabase
      .channel(`orders-alerts-${company.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `company_id=eq.${company.id}` },
        (payload: any) => {
          playChime();
          toast.success(`Nova encomenda #${payload.new.order_number}`, {
            description: `${payload.new.customer_name} · ${eur(payload.new.total)}`,
            action: { label: 'Ver', onClick: () => navigate('/orders') },
            duration: 10000,
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [company.id, navigate]);

  return (
    <div className="min-h-screen bg-muted/40 flex">
      <Sidebar isOpen={open} toggleSidebar={() => setOpen(!open)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {title && <h1 className="text-2xl font-bold mb-4">{title}</h1>}
          {company.id ? children : <p className="text-muted-foreground">A carregar empresa… (inicie sessão como empresa se não aparecer)</p>}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
