-- 1) Création de la table des absences
create table public.absences (
  id bigint generated always as identity primary key,
  prenom text not null,
  type text not null check (type in ('congés', 'RTT', 'maladie', 'télétravail')),
  date_debut date not null,
  date_fin date not null,
  created_at timestamptz not null default now(),
  check (date_fin >= date_debut)
);

-- 2) Activation de la sécurité au niveau des lignes (RLS)
alter table public.absences enable row level security;

-- Autorise le rôle public (anon) à lire et ajouter, rien d'autre
grant select, insert on public.absences to anon;

-- 3) Règle : tout visiteur de l'app peut LIRE les absences
create policy "Lecture publique des absences"
  on public.absences for select
  to anon
  using (true);

-- 4) Règle : tout visiteur de l'app peut AJOUTER une absence
create policy "Ajout public des absences"
  on public.absences for insert
  to anon
  with check (true);

-- Aucune règle pour modifier ou supprimer : ces actions restent impossibles depuis l'app.
