create table if not exists public.student_registrations (
 id uuid primary key default gen_random_uuid(),
 student_id text not null unique,
 full_name text not null,
 gender text not null,
 date_of_birth date,
 phone text not null unique,
 email text,
 education_category text not null,
 institution text not null,
 faculty text,
 department text,
 course_of_study text,
 academic_level text not null,
 church_unit text,
 fellowship_group text,
 membership_status text,
 residential_address text,
 emergency_contact_name text,
 emergency_contact_phone text,
 emergency_contact_relationship text,
 guardian_name text,
 guardian_phone text,
 guardian_consent boolean not null default false,
 data_consent boolean not null default false,
 google_drive_photo_url text,
 google_sheet_sync_status text not null default 'pending' check (google_sheet_sync_status in ('pending','synced','failed')),
 google_sheet_synced_at timestamptz,
 google_sheet_sync_error text,
 created_at timestamptz not null default now()
);
create unique index if not exists student_registrations_email_unique on public.student_registrations (lower(email)) where email is not null and email <> '';
create index if not exists student_registrations_department_idx on public.student_registrations(department);
create index if not exists student_registrations_created_at_idx on public.student_registrations(created_at desc);

create table if not exists public.student_registration_access (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null unique references auth.users(id) on delete cascade,
 role text not null check (role in ('church_admin','department_leader')),
 department text,
 is_active boolean not null default true,
 created_at timestamptz not null default now()
);

alter table public.student_registrations enable row level security;
alter table public.student_registration_access enable row level security;

create or replace function public.is_student_registration_admin()
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
 or exists(select 1 from public.student_registration_access a where a.user_id=auth.uid() and a.is_active and a.role='church_admin');
$$;

create or replace function public.can_read_student_registrations(target_department text)
returns boolean language sql stable security definer set search_path=public as $$
 select public.is_student_registration_admin()
 or exists(select 1 from public.student_registration_access a where a.user_id=auth.uid() and a.is_active and a.role='department_leader' and a.department is not null and a.department=target_department);
$$;

drop policy if exists "Authorized leaders can read student registrations" on public.student_registrations;
create policy "Authorized leaders can read student registrations" on public.student_registrations for select to authenticated using (public.can_read_student_registrations(department));
drop policy if exists "Church admins can update student registrations" on public.student_registrations;
create policy "Church admins can update student registrations" on public.student_registrations for update to authenticated using (public.is_student_registration_admin()) with check (public.is_student_registration_admin());
drop policy if exists "Users can read their own student access" on public.student_registration_access;
create policy "Users can read their own student access" on public.student_registration_access for select to authenticated using (user_id=auth.uid() or public.is_student_registration_admin());
drop policy if exists "Church admins can manage student access" on public.student_registration_access;
create policy "Church admins can manage student access" on public.student_registration_access for all to authenticated using (public.is_student_registration_admin()) with check (public.is_student_registration_admin());

grant select, update on public.student_registrations to authenticated;
grant select, insert, update, delete on public.student_registration_access to authenticated;
