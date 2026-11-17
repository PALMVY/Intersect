-- Trilha das 12 Casas: perfil, progresso e sinais de leitura. Tudo protegido por RLS.
-- Como aplicar: cole este arquivo no SQL Editor do painel do Supabase e execute uma vez.

create table if not exists public.user_profile (
  user_id uuid primary key references auth.users (id) on delete cascade,
  entry_house int not null default 1,
  diagnostic_answers jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  house_id int not null,
  state text not null check (state in ('locked', 'bypassed', 'in_progress', 'completed')),
  checklist_done jsonb not null default '[]'::jsonb,
  best_quiz_score int not null default 0 check (best_quiz_score between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (user_id, house_id)
);

create table if not exists public.user_thinker_signal (
  user_id uuid not null references auth.users (id) on delete cascade,
  thinker_id text not null,
  read boolean not null default false,
  favorite boolean not null default false,
  quiz_passed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, thinker_id)
);

-- updated_at é sempre definido pelo banco: é ele que mostra quantos dias cada pessoa voltou.
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_user_progress on public.user_progress;
create trigger touch_user_progress before insert or update on public.user_progress
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_user_thinker_signal on public.user_thinker_signal;
create trigger touch_user_thinker_signal before insert or update on public.user_thinker_signal
  for each row execute function public.touch_updated_at();

alter table public.user_profile enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_thinker_signal enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['user_profile', 'user_progress', 'user_thinker_signal'] loop
    execute format('drop policy if exists "own rows select" on public.%I', table_name);
    execute format('drop policy if exists "own rows insert" on public.%I', table_name);
    execute format('drop policy if exists "own rows update" on public.%I', table_name);
    execute format('create policy "own rows select" on public.%I for select using (auth.uid() = user_id)', table_name);
    execute format('create policy "own rows insert" on public.%I for insert with check (auth.uid() = user_id)', table_name);
    execute format('create policy "own rows update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', table_name);
  end loop;
end;
$$;
