-- HiveMind Protocol schema (ARCH.md §10)

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists users_wallet_address_idx on public.users (wallet_address);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  problem_statement text not null,
  goal text not null default '',
  status text not null default 'pending' check (status in ('pending', 'running', 'finalized')),
  content_hash text,
  created_at timestamptz not null default now()
);

create index if not exists workspaces_creator_id_idx on public.workspaces (creator_id);
create index if not exists workspaces_created_at_idx on public.workspaces (created_at desc);

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  role text not null check (
    role in ('research', 'market', 'risk', 'technical', 'critic', 'synthesizer')
  ),
  status text not null default 'queued' check (
    status in ('queued', 'running', 'done', 'failed')
  )
);

create index if not exists agents_workspace_id_idx on public.agents (workspace_id);

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  agent_id uuid not null references public.agents (id) on delete cascade,
  content jsonb not null default '{}',
  content_hash text not null default '',
  score int not null default 0 check (score >= 0 and score <= 100),
  created_at timestamptz not null default now()
);

create index if not exists contributions_workspace_id_idx on public.contributions (workspace_id);
create index if not exists contributions_content_hash_idx on public.contributions (content_hash);

create table if not exists public.consensus (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  contribution_id uuid not null references public.contributions (id) on delete cascade,
  critic_notes text not null default '',
  final_score int not null default 0 check (final_score >= 0 and final_score <= 100)
);

create index if not exists consensus_workspace_id_idx on public.consensus (workspace_id);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces (id) on delete cascade,
  executive_summary text not null default '',
  key_findings jsonb not null default '[]',
  risks jsonb not null default '[]',
  recommendations jsonb not null default '[]',
  storage_url text
);

-- RLS
alter table public.users enable row level security;
alter table public.workspaces enable row level security;
alter table public.agents enable row level security;
alter table public.contributions enable row level security;
alter table public.consensus enable row level security;
alter table public.reports enable row level security;

-- Phase 1: service role bypasses RLS; Phase 3 adds real SIWE auth.uid() mapping.
-- Policy sketch for workspaces (active when auth.uid() maps to users.id):
create policy "workspaces_select_own"
  on public.workspaces for select
  using (creator_id = auth.uid());

create policy "workspaces_insert_own"
  on public.workspaces for insert
  with check (creator_id = auth.uid());

create policy "workspaces_update_own"
  on public.workspaces for update
  using (creator_id = auth.uid());
