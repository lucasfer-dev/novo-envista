-- The application no longer calls this anonymous preflight.
-- Keep duplicate detection inside the protected Supabase Auth transaction so
-- arbitrary CPF/CNPJ values cannot be probed through the Data API.

revoke all on function public.signup_identifier_available(text,text)
from public, anon, authenticated;
