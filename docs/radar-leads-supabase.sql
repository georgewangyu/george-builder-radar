create table if not exists public.radar_leads (
  product text not null,
  email text not null,
  name text not null,
  repo_url text,
  source text not null default 'website-install-gate',
  consent_updates boolean not null default true,
  install_command_revealed boolean not null default true,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint radar_leads_product_email_key unique (product, email),
  constraint radar_leads_product_check check (
    product in (
      'ai-leaderboard-radar',
      'ai-radar',
      'books-radar',
      'george-builder-radar',
      'hooksradar',
      'loops-radar',
      'sports-radar'
    )
  )
);

alter table public.radar_leads enable row level security;

drop policy if exists "No public radar lead reads" on public.radar_leads;
drop policy if exists "No public radar lead writes" on public.radar_leads;

create policy "No public radar lead reads"
  on public.radar_leads
  for select
  using (false);

create policy "No public radar lead writes"
  on public.radar_leads
  for insert
  with check (false);

create index if not exists radar_leads_created_at_idx
  on public.radar_leads (created_at desc);

create index if not exists radar_leads_product_created_at_idx
  on public.radar_leads (product, created_at desc);
