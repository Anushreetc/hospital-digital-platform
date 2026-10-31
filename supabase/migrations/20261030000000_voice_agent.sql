-- ElevenLabs voice agent: server-side secrets for the voice Edge Functions and
-- live updates for the Reception "AI Receptionist Desk".

-- Secrets live in Supabase Vault. Only the service role (used inside the
-- voice-tools / voice-call-log Edge Functions) can read them, and only the
-- ones prefixed "voice_".
create or replace function public.voice_agent_secret(p_name text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = p_name and p_name like 'voice\_%';
$$;

revoke all on function public.voice_agent_secret(text) from public, anon, authenticated;
grant execute on function public.voice_agent_secret(text) to service_role;

-- Shared secret ElevenLabs sends with every server-tool request. Generated
-- once; read it from Vault when configuring the agent's tools.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'voice_tools_secret') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'voice_tools_secret',
      'Header x-voice-secret expected by the voice-tools Edge Function'
    );
  end if;
end;
$$;

-- The HMAC secret for ElevenLabs post-call webhooks is issued by ElevenLabs.
-- Store it with:
--   select vault.create_secret('<secret>', 'voice_webhook_secret', 'ElevenLabs post-call webhook HMAC');

-- Reception sees new voice calls without reloading.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'voice_calls'
  ) then
    alter publication supabase_realtime add table public.voice_calls;
  end if;
end;
$$;
