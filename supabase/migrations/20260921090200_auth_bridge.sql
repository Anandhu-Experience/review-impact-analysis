-- Links a Supabase Auth signup to its seeded owner row.
--
-- Kept in its own file because it is the one statement that touches the `auth` schema. If
-- your role cannot create a trigger there, only this file fails — the schema and the
-- policies stay applied, and you can link accounts by hand instead (see the bottom).

create or replace function public.link_owner_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.owners
     set auth_user_id = new.id
   where auth_user_id is null
     and lower(email) = lower(new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.link_owner_on_signup();

-- Manual fallback, if the trigger could not be created: after signing up, run
--   update public.owners o set auth_user_id = u.id
--     from auth.users u where lower(u.email) = lower(o.email) and o.auth_user_id is null;

select 'auth bridge installed' as status;
