-- Migration: Cleanup and reorganize roles structure
-- Description: Removes old role tables and ensures users table has the correct role column

-- Drop functions that depend on the tables first
drop function if exists public.assign_role(uuid, app_role);
drop function if exists public.get_my_role();
drop function if exists public.has_permission(app_permission);
drop function if exists public.authorize(app_permission);
drop function if exists public.custom_access_token_hook(jsonb);

-- Now we can drop the tables
drop table if exists public.role_permissions;
drop table if exists public.user_roles;

-- And finally the types
drop type if exists public.app_permission;
drop type if exists public.app_role;

-- Ensure user_role type exists
do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'user');
  end if;
end $$;

-- Ensure users table has role column
do $$ begin
  if not exists (
    select 1 
    from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'users' 
    and column_name = 'role'
  ) then
    alter table public.users add column role user_role default 'user'::user_role;
  end if;
end $$;

-- Update handle_new_user function to set role
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, email, full_name, role)
    values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user'::user_role);
    return new;
end;
$$ language plpgsql security definer;

-- Create helper function to check if user is admin
create or replace function public.is_admin()
returns boolean as $$
declare
    user_role_val public.user_role;
begin
    select role into user_role_val
    from public.users
    where id = auth.uid();
    return user_role_val = 'admin'::user_role;
end;
$$ language plpgsql stable security definer;

-- Update RLS policies for users table
drop policy if exists "Users can view themselves, admins can view all" on public.users;
create policy "Users can view themselves, admins can view all" 
    on public.users 
    for select 
    using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can update their own profile" on public.users;
create policy "Users can update their own profile" 
    on public.users 
    for update 
    using (auth.uid() = id);

-- Grant necessary permissions
grant execute on function public.is_admin to authenticated; 