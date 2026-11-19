-- Tout est regroupé dans un seul bloc pour pouvoir l'exécuter en une seule fois.
do $$
begin
  -- 1) Création de la table des absences
  create table if not exists public.absences (
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

  -- 3) Le rôle public (anon) peut lire et ajouter, rien d'autre
  grant select, insert on public.absences to anon;

  -- 4) Règle : tout visiteur de l'app peut LIRE les absences
  drop policy if exists "Lecture publique des absences" on public.absences;
  create policy "Lecture publique des absences"
    on public.absences for select to anon using (true);

  -- 5) Règle : tout visiteur de l'app peut AJOUTER une absence
  drop policy if exists "Ajout public des absences" on public.absences;
  create policy "Ajout public des absences"
    on public.absences for insert to anon with check (true);

  -- Aucune règle pour modifier ou supprimer : ces actions restent impossibles depuis l'app.
end
$$;
