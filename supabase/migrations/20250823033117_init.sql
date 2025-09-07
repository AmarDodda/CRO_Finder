-- enable uuid generator (safe if already enabled)
create extension if not exists pgcrypto;

-- 1. User Profiles (linked to Supabase Auth)
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  role text check (role in ('sponsor', 'cro', 'admin')) default 'sponsor',
  created_at timestamptz default now()
);

alter table public.user_profiles enable row level security;

-- Example RLS: each user can see/update their own profile
create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

-- 2. CROs (Contract Research Organizations)
create table if not exists public.cros (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  country text,
  specialties text[],         -- e.g. ["oncology", "phase3"]
  created_at timestamptz default now()
);

alter table public.cros enable row level security;

create policy "CROs are readable by all"
  on public.cros for select using (true);

-- 3. Projects (sponsor-submitted studies)
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner uuid references public.user_profiles(id) on delete set null,
  title text not null,
  description text,
  therapy_area text,
  phase text,
  budget numeric,
  created_at timestamptz default now()
);

alter table public.projects enable row level security;

create policy "Anyone can read projects"
  on public.projects for select using (true);

create policy "Users can insert/update their own projects"
  on public.projects for all
  using (auth.uid() = owner)
  with check (auth.uid() = owner);

-- 4. Matches (link projects ↔ CROs with a score)
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  cro_id uuid references public.cros(id) on delete cascade,
  score numeric check (score between 0 and 1),
  created_at timestamptz default now()
);

alter table public.matches enable row level security;

create policy "Matches are readable by all"
  on public.matches for select using (true);

-- 5. Contacts (messages/exchange between sponsors & CROs)
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  sender uuid references public.user_profiles(id) on delete set null,
  recipient uuid references public.user_profiles(id) on delete set null,
  project_id uuid references public.projects(id) on delete cascade,
  message text not null,
  sent_at timestamptz default now()
);

alter table public.contacts enable row level security;

create policy "Users can view messages where they are sender or recipient"
  on public.contacts for select
  using (auth.uid() = sender or auth.uid() = recipient);

create policy "Users can insert messages if they are sender"
  on public.contacts for insert
  with check (auth.uid() = sender);
