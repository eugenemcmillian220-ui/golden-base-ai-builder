-- Supabase Schema for Golden Base AI Builder
-- Includes RLS policies and Realtime configurations

-- 1. PROFILES
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  constraint username_length check (char_length(username) >= 3)
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- 2. PROJECTS
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  user_id uuid references auth.users not null,
  code text default '',
  metadata jsonb default '{}'::jsonb,
  is_public boolean default false
);

alter table projects enable row level security;

create policy "Projects are viewable by owner, shared users, or if public." on projects
  for select using (
    auth.uid() = user_id or 
    exists (
      select 1 from project_shares 
      where project_id = projects.id and user_id = auth.uid()
    ) or
    is_public = true
  );

create policy "Users can create projects." on projects
  for insert with check (auth.uid() = user_id);

create policy "Owners and editors can update projects." on projects
  for update using (
    auth.uid() = user_id or 
    exists (
      select 1 from project_shares 
      where project_id = projects.id and user_id = auth.uid() and role in ('owner', 'editor', 'admin')
    )
  );

create policy "Owners can delete projects." on projects
  for delete using (
    auth.uid() = user_id or 
    exists (
      select 1 from project_shares 
      where project_id = projects.id and user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- 3. PROJECT SHARES (RBAC)
create table if not exists project_shares (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text not null check (role in ('owner', 'editor', 'viewer', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(project_id, user_id)
);

alter table project_shares enable row level security;

create policy "Shares are viewable by project members." on project_shares
  for select using (
    exists (
      select 1 from projects p
      where p.id = project_shares.project_id and p.user_id = auth.uid()
    ) or
    user_id = auth.uid()
  );

create policy "Owners can manage shares." on project_shares
  for all using (
    exists (
      select 1 from projects p
      where p.id = project_shares.project_id and p.user_id = auth.uid()
    )
  );

-- 4. PROJECT VERSIONS
create table if not exists project_versions (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects on delete cascade not null,
  version integer not null,
  user_id uuid references auth.users on delete cascade not null,
  changes jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(project_id, version)
);

alter table project_versions enable row level security;

create policy "Versions are viewable by project members." on project_versions
  for select using (
    exists (
      select 1 from projects p
      where p.id = project_versions.project_id and (p.user_id = auth.uid() or p.is_public = true)
    ) or
    exists (
      select 1 from project_shares ps
      where ps.project_id = project_versions.project_id and ps.user_id = auth.uid()
    )
  );

create policy "Editors can insert versions." on project_versions
  for insert with check (
    exists (
      select 1 from projects p
      where p.id = project_versions.project_id and p.user_id = auth.uid()
    ) or
    exists (
      select 1 from project_shares ps
      where ps.project_id = project_versions.project_id and ps.user_id = auth.uid() and role in ('owner', 'editor', 'admin')
    )
  );

-- 5. COMMENTS
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  line_number integer,
  parent_id uuid references comments on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table comments enable row level security;

create policy "Comments are viewable by project members." on comments
  for select using (
    exists (
      select 1 from projects p
      where p.id = comments.project_id and (p.user_id = auth.uid() or p.is_public = true)
    ) or
    exists (
      select 1 from project_shares ps
      where ps.project_id = comments.project_id and ps.user_id = auth.uid()
    )
  );

create policy "Project members can insert comments." on comments
  for insert with check (
    exists (
      select 1 from projects p
      where p.id = comments.project_id and p.user_id = auth.uid()
    ) or
    exists (
      select 1 from project_shares ps
      where ps.project_id = comments.project_id and ps.user_id = auth.uid() and role in ('owner', 'editor', 'admin')
    )
  );

-- 6. ACTIVITY LOGS
create table if not exists activity_logs (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  type text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table activity_logs enable row level security;

create policy "Activity logs are viewable by project members." on activity_logs
  for select using (
    exists (
      select 1 from projects p
      where p.id = activity_logs.project_id and p.user_id = auth.uid()
    ) or
    exists (
      select 1 from project_shares ps
      where ps.project_id = activity_logs.project_id and ps.user_id = auth.uid()
    )
  );

-- 7. DEPLOYMENTS
create table if not exists deployments (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  platform text not null,
  status text not null,
  url text,
  deployment_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table deployments enable row level security;

create policy "Deployments are viewable by project members." on deployments
  for select using (
    exists (
      select 1 from projects p
      where p.id = deployments.project_id and p.user_id = auth.uid()
    ) or
    exists (
      select 1 from project_shares ps
      where ps.project_id = deployments.project_id and ps.user_id = auth.uid()
    )
  );

-- 8. REALTIME CONFIGURATION
-- Enable Realtime for specific tables
begin;
  -- drop the publication if it exists to avoid errors
  drop publication if exists supabase_realtime;
  -- create publication
  create publication supabase_realtime;
commit;

-- Add tables to the publication
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table activity_logs;
alter publication supabase_realtime add table project_versions;
