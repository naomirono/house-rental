create table units (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,               -- UPPERCASE: SR1-SR9 single rooms, OB1-OB4 one bedrooms
  type text not null check (type in ('single','one_bedroom')),
  rent int not null
);
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'tenant'
);
create table tenants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  unit_id uuid references units,
  name text not null,
  phone text not null,                      -- 2547XXXXXXXX
  active boolean not null default true,
  created_at timestamptz default now()
);
create table charges (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants on delete cascade,
  kind text not null check (kind in ('rent','water')),
  period text not null,                     -- YYYY-MM
  amount int not null,
  paid_amount int not null default 0,
  due_date date not null,
  status text not null default 'unpaid' check (status in ('paid','unpaid')),
  created_at timestamptz default now(),
  unique (tenant_id, kind, period)
);
create table payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants,        -- null = unmatched
  mpesa_receipt text unique not null,
  phone text,
  account_ref text,
  amount int not null,
  paid_at timestamptz default now()
);
create table stk_requests (
  checkout_id text primary key,
  tenant_id uuid references tenants
);
create table payer_links (          -- remembers 'this payer = this tenant' after you match once
  phone text primary key,
  tenant_id uuid not null references tenants on delete cascade
);
create table messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants on delete cascade,
  kind text, body text, status text,
  created_at timestamptz default now()
);

create view tenant_balances with (security_invoker = true) as
select t.id as tenant_id,
  coalesce((select sum(amount) from charges c where c.tenant_id = t.id), 0)
  - coalesce((select sum(amount) from payments p where p.tenant_id = t.id), 0) as balance
from tenants t;   -- positive = owes, negative = credit

create function is_admin() returns boolean language sql security definer stable as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'admin') $$;

alter table units enable row level security;
alter table profiles enable row level security;
alter table tenants enable row level security;
alter table charges enable row level security;
alter table payments enable row level security;
alter table stk_requests enable row level security;
alter table messages enable row level security;
alter table payer_links enable row level security;

create policy "admin all" on units for all using (is_admin()) with check (is_admin());
create policy "admin all" on profiles for all using (is_admin()) with check (is_admin());
create policy "admin all" on tenants for all using (is_admin()) with check (is_admin());
create policy "admin all" on charges for all using (is_admin()) with check (is_admin());
create policy "admin all" on payments for all using (is_admin()) with check (is_admin());
create policy "admin all" on messages for all using (is_admin()) with check (is_admin());

create policy "read units" on units for select to authenticated using (true);
create policy "own profile" on profiles for select using (id = auth.uid());
create policy "own tenant" on tenants for select using (user_id = auth.uid());
create policy "own charges" on charges for select
  using (tenant_id in (select id from tenants where user_id = auth.uid()));
create policy "own payments" on payments for select
  using (tenant_id in (select id from tenants where user_id = auth.uid()));
create policy "own messages" on messages for select
  using (tenant_id in (select id from tenants where user_id = auth.uid()));

-- Your 13 units (edit the rents afterwards)
insert into units (name, type, rent) select 'SR' || g, 'single', 3500 from generate_series(1, 9) g;
insert into units (name, type, rent) select 'OB' || g, 'one_bedroom', 6500 from generate_series(1, 4) g;

-- After creating YOUR login in Supabase Auth > Users, make yourself admin:
-- insert into profiles (id, role) values ('<your-auth-user-uuid>', 'admin');
