ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS banner_url text, ADD COLUMN IF NOT EXISTS description text;

CREATE TABLE public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_key text not null,
  note text not null,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_notes TO authenticated;
GRANT ALL ON public.customer_notes TO service_role;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage notes" ON public.customer_notes FOR ALL TO authenticated
  USING (public.is_company_owner(company_id)) WITH CHECK (public.is_company_owner(company_id));

CREATE OR REPLACE FUNCTION public.place_booking(p_company_id uuid, p_service_id uuid, p_date timestamptz, p_party_size int, p_customer jsonb, p_items jsonb DEFAULT '[]'::jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE sv record; s record; v_cust uuid; v_dep numeric := 0; v_app uuid; v_order uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Inicie sessão para reservar'; END IF;
  SELECT * INTO sv FROM public.services WHERE id = p_service_id AND company_id = p_company_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Serviço não encontrado'; END IF;
  IF p_date < now() THEN RAISE EXCEPTION 'Horário já passou'; END IF;
  IF EXISTS (SELECT 1 FROM public.appointments a WHERE a.company_id = p_company_id AND coalesce(a.status,'') NOT IN ('cancelled','no_show')
     AND a.appointment_date < p_date + make_interval(mins => sv.duration)
     AND a.appointment_date + make_interval(mins => a.service_duration) > p_date) THEN
    RAISE EXCEPTION 'Este horário acabou de ser ocupado, escolha outro';
  END IF;
  SELECT * INTO s FROM public.company_settings WHERE company_id = p_company_id;
  IF s.deposit_mode = 'percent' THEN v_dep := round(coalesce(sv.price,0) * s.deposit_value / 100, 2);
  ELSIF s.deposit_mode = 'fixed' THEN v_dep := least(s.deposit_value, coalesce(sv.price, s.deposit_value));
  ELSIF s.deposit_mode = 'full' THEN v_dep := coalesce(sv.price,0); END IF;

  SELECT id INTO v_cust FROM public.customers WHERE user_id = auth.uid() LIMIT 1;
  IF v_cust IS NULL THEN
    INSERT INTO public.customers(user_id, name, email, phone) VALUES (auth.uid(), coalesce(p_customer->>'name','Cliente'), coalesce(p_customer->>'email',''), coalesce(p_customer->>'phone',''))
    RETURNING id INTO v_cust;
  END IF;

  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    v_order := public.place_order(p_company_id, p_items, 'pickup', p_customer, NULL, NULL, NULL, 'Levantar na reserva', 'booking');
  END IF;

  INSERT INTO public.appointments(customer_id, company_id, service_name, service_price, service_duration, appointment_date, status, party_size, deposit_amount, payment_status, order_id)
  VALUES (v_cust, p_company_id, sv.name, sv.price, sv.duration, p_date, 'scheduled', p_party_size, v_dep, CASE WHEN v_dep > 0 THEN 'paid_test' ELSE 'none' END, v_order)
  RETURNING id INTO v_app;
  RETURN v_app;
END; $$;
GRANT EXECUTE ON FUNCTION public.place_booking(uuid, uuid, timestamptz, int, jsonb, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_booked_slots(p_company_id uuid, p_from timestamptz, p_to timestamptz)
RETURNS TABLE(appointment_date timestamptz, service_duration integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT a.appointment_date, a.service_duration FROM public.appointments a
  WHERE a.company_id = p_company_id AND a.appointment_date >= p_from AND a.appointment_date < p_to AND coalesce(a.status,'') NOT IN ('cancelled','no_show')
$$;