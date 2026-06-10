
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'General',
  excerpt text,
  content text not null,
  image_url text,
  created_at timestamptz not null default now()
);
grant select on public.articles to anon, authenticated;
grant all on public.articles to service_role;
alter table public.articles enable row level security;
create policy "articles_public_read" on public.articles for select using (true);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  student_name text,
  description text,
  file_url text,
  file_name text,
  created_at timestamptz not null default now()
);
grant select on public.projects to anon, authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
create policy "projects_public_read" on public.projects for select using (true);

create table public.admin_credentials (
  id int primary key default 1,
  username text not null,
  password_hash text not null,
  salt text not null,
  constraint single_admin check (id = 1)
);
grant all on public.admin_credentials to service_role;
alter table public.admin_credentials enable row level security;

insert into public.admin_credentials (id, username, password_hash, salt)
values (1, 'profu_de_istorie67',
  '2a53a0a6eac334beb5e1aeff95da837d0437d925469c75af9393bfc8601a4fb91920b6c9a8e2294e9ee79c2875f99c6b9119ba42da66a992579ffa7507473cf4',
  'ffaef71d3af68b1fc7cdf7105a2e989a');

insert into public.articles (title, category, excerpt, content) values
('Dacii și Romanii — întâlnirea a două lumi', 'Antichitate', 'O scurtă privire asupra războaielor daco-romane și a moștenirii lăsate de cele două civilizații.', 'Războaiele daco-romane (101-102 și 105-106 d.Hr.) au marcat sfârșitul regatului dac condus de Decebal și începutul provinciei romane Dacia. Cucerirea a fost imortalizată pe Columna lui Traian la Roma.\n\nDin amestecul dintre daci și romani s-a născut, peste secole, poporul român — vorbitor al unei limbi neolatine păstrate la marginea estică a fostului imperiu.'),
('Mihai Viteazul și prima unire', 'Evul Mediu', 'În 1600, pentru câteva luni, cele trei țări române au fost conduse de un singur domnitor.', 'Mihai Viteazul, domn al Țării Românești, reușește la 1 noiembrie 1599 să intre victorios în Alba Iulia, devenind stăpân al Transilvaniei. În mai 1600 ocupă și Moldova, realizând prima unire politică a celor trei țări române.\n\nUnirea a durat puțin, dar a rămas un simbol puternic pentru generațiile următoare, până la Marea Unire de la 1918.'),
('1 Decembrie 1918 — Marea Unire', 'Epoca Modernă', 'Adunarea de la Alba Iulia votează unirea Transilvaniei cu România.', 'În toamna anului 1918, după prăbușirea Austro-Ungariei, românii din Transilvania au organizat o adunare națională la Alba Iulia. Peste 1.200 de delegați și mai bine de 100.000 de oameni au votat unirea cu Regatul României.\n\nMomentul este sărbătorit astăzi ca Ziua Națională a României.');
