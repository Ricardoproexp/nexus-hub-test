REVOKE EXECUTE ON FUNCTION public.place_booking(uuid, uuid, timestamptz, int, jsonb, jsonb) FROM PUBLIC, anon;
REVOKE SELECT ON public.customer_notes FROM anon;