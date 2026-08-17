create extension if not exists pgcrypto;

create type public.user_role as enum (
  'patient',
  'doctor',
  'manager',
  'reception',
  'laboratory',
  'storekeeper'
);

create type public.ticket_status as enum (
  'waiting',
  'with-doctor',
  'paying',
  'pharmacy',
  'done',
  'removed'
);

create type public.request_status as enum (
  'requested',
  'done'
);

create table public.users (
  id uuid primary key default gen_random_uuid(),
  role public.user_role not null,
  first_name text not null,
  last_name text not null,
  username text,
  phone text,
  password text not null,
  sex text check (sex in ('male', 'female')),
  insurance text,
  province text,
  district text,
  sector text,
  village text,
  department_codes text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(username)
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department_code text not null,
  created_at timestamptz default now()
);

create table public.lab_tests (
  id text primary key,
  name text not null,
  description text,
  department_code text not null default 'LB',
  created_at timestamptz default now()
);

create table public.medicines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stock integer not null default 0,
  price numeric(12,2) not null default 0,
  created_at timestamptz default now()
);

create table public.queue_tickets (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.users(id) on delete cascade,
  patient_name text not null,
  insurance text,
  vitals jsonb not null default '{}',
  token text not null,
  department text not null,
  department_code text not null,
  created_at bigint not null,
  status public.ticket_status not null default 'waiting',
  assigned_doctor_id uuid references public.users(id),
  assigned_doctor_name text,
  diagnosis text,
  doctor_note text,
  paid boolean default false,
  paid_amount numeric(12,2) default 0,
  dispensed_at bigint,
  lab_requested_tests jsonb default '[]'::jsonb,
  lab_results jsonb default '[]'::jsonb,
  prescription jsonb default '[]'::jsonb
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.users(id) on delete cascade,
  doctor_name text not null,
  role public.user_role not null,
  department text not null,
  login_at bigint not null,
  logout_at bigint,
  created_at timestamptz default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role public.user_role not null,
  content text not null,
  created_at bigint not null,
  created_at_dt timestamptz default now()
);

create index idx_users_role on public.users(role);
create index idx_users_username on public.users(username);
create index idx_queue_tickets_status on public.queue_tickets(status);
create index idx_queue_tickets_department on public.queue_tickets(department_code);
create index idx_queue_tickets_patient on public.queue_tickets(patient_id);
create index idx_attendance_doctor on public.attendance(doctor_id);

-- Seed default staff users to mirror the current frontend behavior.
insert into public.users (role, first_name, last_name, username, password, department_codes)
values
  ('doctor', 'Jean', 'Mugisha', 'doctor', 'doctor123', array['DC','EY','EN','MA','PD']),
  ('reception', 'Aline', 'Uwase', 'reception', 'reception123', '{}'),
  ('laboratory', 'Lab', 'Tech', 'lab', 'lab123', '{}'),
  ('storekeeper', 'Eric', 'Nshimiyimana', 'pharmacy', 'pharmacy123', '{}'),
  ('manager', 'Claire', 'Ingabire', 'manager', 'manager123', '{}')
on conflict (username) do nothing;

insert into public.lab_tests (id, name, description, department_code)
values
  ('cbc', 'Complete Blood Count (CBC)', 'Blood cell counts', 'LB'),
  ('malaria', 'Malaria Rapid Test', 'Detection of malaria', 'LB'),
  ('urinalysis', 'Urinalysis', 'Urine screening', 'LB'),
  ('rbs', 'Random Blood Sugar (RBS)', 'Blood sugar check', 'LB'),
  ('preg', 'Pregnancy Test (hCG)', 'Hormone pregnancy test', 'LB'),
  ('chol', 'Cholesterol', 'Lipid profile screening', 'LB')
on conflict (id) do nothing;

insert into public.medicines (name, stock, price)
values
  ('Paracetamol 500mg', 120, 500),
  ('Amoxicillin 250mg', 60, 1500),
  ('Ibuprofen 200mg', 80, 800),
  ('ORS sachet', 200, 300)
on conflict do nothing;

-- Basic read access for authenticated users.
alter table public.users enable row level security;
alter table public.rooms enable row level security;
alter table public.lab_tests enable row level security;
alter table public.medicines enable row level security;
alter table public.queue_tickets enable row level security;
alter table public.attendance enable row level security;
alter table public.reports enable row level security;

create policy "Allow all authenticated access" on public.users
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Allow all authenticated access" on public.rooms
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Allow all authenticated access" on public.lab_tests
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Allow all authenticated access" on public.medicines
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Allow all authenticated access" on public.queue_tickets
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Allow all authenticated access" on public.attendance
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Allow all authenticated access" on public.reports
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
