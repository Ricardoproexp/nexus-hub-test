REVOKE EXECUTE ON FUNCTION public.orders_status_trigger() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cancel_my_order(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_my_appointment(uuid) FROM PUBLIC, anon;