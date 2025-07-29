-- Verificar as políticas RLS existentes para services
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'services';

-- Adicionar política de DELETE para services
DROP POLICY IF EXISTS "Services can be deleted by company owners" ON public.services;

CREATE POLICY "Services can be deleted by company owners" 
ON public.services 
FOR DELETE 
USING (auth.uid() IN (
    SELECT companies.user_id
    FROM companies
    WHERE companies.id = services.company_id
));