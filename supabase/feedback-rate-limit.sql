-- Feedback is available to signed-in users and limited across all app instances.
create or replace function public.guard_feedback_insert()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if auth.uid() is null or new.user_id is distinct from auth.uid() then
    raise exception 'feedback_auth_required';
  end if;

  if char_length(trim(new.message)) not between 10 and 5000
     or coalesce(char_length(new.contact_email), 0) > 254
     or (new.contact_email is not null and new.contact_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
     or (new.can_contact and coalesce(trim(new.contact_email), '') = '')
     or coalesce(char_length(new.page_url), 0) > 2048
     or coalesce(char_length(new.page_title), 0) > 512
     or coalesce(char_length(new.app_version), 0) > 128
     or coalesce(char_length(new.browser_info), 0) > 4096
     or char_length(new.locale) > 16 then
    raise exception 'feedback_invalid';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
  new.created_at := now();
  new.status := 'new';
  new.email_delivery_status := 'unverified';
  if (select count(*) from public.feedback
      where user_id = new.user_id and created_at > now() - interval '15 minutes') >= 5 then
    raise exception 'feedback_rate_limit';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_feedback_insert() from public, anon, authenticated;
create trigger feedback_insert_guard before insert on public.feedback
for each row execute function public.guard_feedback_insert();
grant select, insert on table public.feedback to authenticated;
