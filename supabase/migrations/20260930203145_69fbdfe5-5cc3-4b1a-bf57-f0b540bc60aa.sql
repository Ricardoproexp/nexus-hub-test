
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.is_company_owner(_company_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.companies WHERE id = _company_id AND user_id = auth.uid())
$$;

-- company settings
CREATE TABLE public.company_settings (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  delivery_enabled boolean NOT NULL DEFAULT true,
  pickup_enabled boolean NOT NULL DEFAULT true,
  shipping_fee numeric NOT NULL DEFAULT 4.99,
  free_shipping_over numeric,
  deposit_mode text NOT NULL DEFAULT 'none',
  deposit_value numeric NOT NULL DEFAULT 0,
  cancel_hours integer NOT NULL DEFAULT 24,
  open_hour integer NOT NULL DEFAULT 8,
  close_hour integer NOT NULL DEFAULT 20,
  slot_minutes integer NOT NULL DEFAULT 30,
  tables_count integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.company_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_settings TO authenticated;
GRANT ALL ON public.company_settings TO service_role;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings public read" ON public.company_settings FOR SELECT USING (true);
CREATE POLICY "Owners manage settings" ON public.company_settings FOR ALL TO authenticated USING (public.is_company_owner(company_id)) WITH CHECK (public.is_company_owner(company_id));
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.company_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,
  price numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products public read" ON public.products FOR SELECT USING (active OR public.is_company_owner(company_id));
CREATE POLICY "Owners manage products" ON public.products FOR ALL TO authenticated USING (public.is_company_owner(company_id)) WITH CHECK (public.is_company_owner(company_id));
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Images public read" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Owners manage images" ON public.product_images FOR ALL TO authenticated
  USING (public.is_company_owner((SELECT company_id FROM public.products p WHERE p.id = product_id)))
  WITH CHECK (public.is_company_owner((SELECT company_id FROM public.products p WHERE p.id = product_id)));

CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Único',
  price_override numeric,
  stock integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Variants public read" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Owners manage variants" ON public.product_variants FOR ALL TO authenticated
  USING (public.is_company_owner((SELECT company_id FROM public.products p WHERE p.id = product_id)))
  WITH CHECK (public.is_company_owner((SELECT company_id FROM public.products p WHERE p.id = product_id)));

-- orders
CREATE SEQUENCE public.order_number_seq START 1001;
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number bigint NOT NULL DEFAULT nextval('public.order_number_seq'),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_user_id uuid,
  kind text NOT NULL DEFAULT 'shop',
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  delivery_method text NOT NULL DEFAULT 'pickup',
  shipping_address jsonb,
  billing_address jsonb,
  nif text,
  notes text,
  subtotal numeric NOT NULL DEFAULT 0,
  shipping_fee numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new',
  payment_status text NOT NULL DEFAULT 'paid_test',
  carrier text,
  tracking_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders visible to owner or customer" ON public.orders FOR SELECT TO authenticated USING (public.is_company_owner(company_id) OR customer_user_id = auth.uid());
CREATE POLICY "Owners update orders" ON public.orders FOR UPDATE TO authenticated USING (public.is_company_owner(company_id)) WITH CHECK (public.is_company_owner(company_id));
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  variant_name text,
  unit_price numeric NOT NULL,
  quantity integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Items visible with order" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (public.is_company_owner(o.company_id) OR o.customer_user_id = auth.uid())));

CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.order_status_history TO authenticated;
GRANT ALL ON public.order_status_history TO service_role;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "History visible with order" ON public.order_status_history FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (public.is_company_owner(o.company_id) OR o.customer_user_id = auth.uid())));

CREATE OR REPLACE FUNCTION public.orders_status_trigger() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_status_history(order_id, status, note) VALUES (NEW.id, NEW.status, 'Encomenda criada');
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_history(order_id, status) VALUES (NEW.id, NEW.status);
    IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
      UPDATE public.product_variants v SET stock = v.stock + i.quantity
      FROM public.order_items i WHERE i.order_id = NEW.id AND i.variant_id = v.id;
    END IF;
  ELSIF NEW.tracking_code IS DISTINCT FROM OLD.tracking_code AND NEW.tracking_code IS NOT NULL THEN
    INSERT INTO public.order_status_history(order_id, status, note) VALUES (NEW.id, NEW.status, 'Rastreio: ' || coalesce(NEW.carrier,'') || ' ' || NEW.tracking_code);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_orders_status AFTER INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.orders_status_trigger();

-- place order
CREATE OR REPLACE FUNCTION public.place_order(
  p_company_id uuid, p_items jsonb, p_delivery_method text, p_customer jsonb,
  p_shipping jsonb DEFAULT NULL, p_billing jsonb DEFAULT NULL, p_nif text DEFAULT NULL,
  p_notes text DEFAULT NULL, p_kind text DEFAULT 'shop'
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order uuid; v_item jsonb; v_var record; v_qty int; v_sub numeric := 0; v_fee numeric := 0; s record;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'Carrinho vazio'; END IF;
  IF coalesce(trim(p_customer->>'name'),'') = '' OR coalesce(trim(p_customer->>'email'),'') = '' THEN RAISE EXCEPTION 'Nome e email obrigatórios'; END IF;
  IF p_delivery_method NOT IN ('delivery','pickup') THEN RAISE EXCEPTION 'Método de entrega inválido'; END IF;
  SELECT * INTO s FROM public.company_settings WHERE company_id = p_company_id;

  INSERT INTO public.orders(company_id, customer_user_id, kind, customer_name, customer_email, customer_phone, delivery_method, shipping_address, billing_address, nif, notes)
  VALUES (p_company_id, auth.uid(), coalesce(p_kind,'shop'), left(p_customer->>'name',120), left(p_customer->>'email',255), left(p_customer->>'phone',40), p_delivery_method, p_shipping, p_billing, left(p_nif,20), left(p_notes,1000))
  RETURNING id INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::int;
    IF v_qty IS NULL OR v_qty < 1 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
    SELECT v.id, v.name, v.stock, coalesce(v.price_override, p.price) AS price, p.id AS pid, p.name AS pname
      INTO v_var FROM public.product_variants v JOIN public.products p ON p.id = v.product_id
      WHERE v.id = (v_item->>'variant_id')::uuid AND p.company_id = p_company_id AND p.active FOR UPDATE OF v;
    IF NOT FOUND THEN RAISE EXCEPTION 'Produto indisponível'; END IF;
    IF v_var.stock < v_qty THEN RAISE EXCEPTION 'Stock insuficiente para %', v_var.pname; END IF;
    UPDATE public.product_variants SET stock = stock - v_qty WHERE id = v_var.id;
    INSERT INTO public.order_items(order_id, product_id, variant_id, product_name, variant_name, unit_price, quantity)
      VALUES (v_order, v_var.pid, v_var.id, v_var.pname, v_var.name, v_var.price, v_qty);
    v_sub := v_sub + v_var.price * v_qty;
  END LOOP;

  IF p_delivery_method = 'delivery' THEN
    v_fee := coalesce(s.shipping_fee, 4.99);
    IF s.free_shipping_over IS NOT NULL AND v_sub >= s.free_shipping_over THEN v_fee := 0; END IF;
  END IF;
  UPDATE public.orders SET subtotal = v_sub, shipping_fee = v_fee, total = v_sub + v_fee WHERE id = v_order;
  RETURN v_order;
END; $$;
GRANT EXECUTE ON FUNCTION public.place_order(uuid, jsonb, text, jsonb, jsonb, jsonb, text, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.cancel_my_order(p_order_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.orders SET status = 'cancelled' WHERE id = p_order_id AND customer_user_id = auth.uid() AND status = 'new';
  IF NOT FOUND THEN RAISE EXCEPTION 'Esta encomenda já não pode ser cancelada'; END IF;
END; $$;
GRANT EXECUTE ON FUNCTION public.cancel_my_order(uuid) TO authenticated;

-- appointments extras
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS party_size integer,
  ADD COLUMN IF NOT EXISTS deposit_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.get_booked_slots(p_company_id uuid, p_from timestamptz, p_to timestamptz)
RETURNS TABLE(appointment_date timestamptz, service_duration integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.appointment_date, a.service_duration FROM public.appointments a
  WHERE a.company_id = p_company_id AND a.appointment_date >= p_from AND a.appointment_date < p_to AND coalesce(a.status,'') <> 'cancelled'
$$;
GRANT EXECUTE ON FUNCTION public.get_booked_slots(uuid, timestamptz, timestamptz) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.cancel_my_appointment(p_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a record; h int;
BEGIN
  SELECT ap.* INTO a FROM public.appointments ap JOIN public.customers c ON c.id = ap.customer_id WHERE ap.id = p_id AND c.user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Reserva não encontrada'; END IF;
  SELECT coalesce(cancel_hours,24) INTO h FROM public.company_settings WHERE company_id = a.company_id;
  IF a.appointment_date - make_interval(hours => coalesce(h,24)) < now() THEN RAISE EXCEPTION 'Prazo de cancelamento ultrapassado (mínimo % h antes)', coalesce(h,24); END IF;
  UPDATE public.appointments SET status = 'cancelled' WHERE id = p_id;
  IF a.order_id IS NOT NULL THEN UPDATE public.orders SET status = 'cancelled' WHERE id = a.order_id AND status = 'new'; END IF;
END; $$;
GRANT EXECUTE ON FUNCTION public.cancel_my_appointment(uuid) TO authenticated;

-- storage policies for product images (bucket created separately)
CREATE POLICY "Product images public read" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Users upload own product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
