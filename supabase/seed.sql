-- ===== CROs =====
insert into public.cros (name, website, country, specialties)
select 'Parexel', 'https://www.parexel.com', 'USA', array['oncology','phase3']
where not exists (select 1 from public.cros where name = 'Parexel');

insert into public.cros (name, website, country, specialties)
select 'IQVIA', 'https://www.iqvia.com', 'USA', array['cardiology','phase3','global']
where not exists (select 1 from public.cros where name = 'IQVIA');

insert into public.cros (name, website, country, specialties)
select 'Labcorp Drug Development', 'https://drugdevelopment.labcorp.com', 'USA', array['rare-disease','phase2']
where not exists (select 1 from public.cros where name = 'Labcorp Drug Development');

insert into public.cros (name, website, country, specialties)
select 'PPD', 'https://www.ppd.com', 'USA', array['oncology','phase2','biostatistics']
where not exists (select 1 from public.cros where name = 'PPD');

insert into public.cros (name, website, country, specialties)
select 'ICON', 'https://www.iconplc.com', 'Ireland', array['endocrinology','phase3','global']
where not exists (select 1 from public.cros where name = 'ICON');

-- ===== Projects =====
insert into public.projects (owner, title, description, therapy_area, phase, budget)
select null, 'Phase II Oncology Study', 'Solid tumor trial with biomarker stratification', 'oncology', 'phase2', 2500000
where not exists (select 1 from public.projects where title = 'Phase II Oncology Study');

insert into public.projects (owner, title, description, therapy_area, phase, budget)
select null, 'Phase III Cardiology Trial', 'Large-scale outcomes study for heart failure', 'cardiology', 'phase3', 7500000
where not exists (select 1 from public.projects where title = 'Phase III Cardiology Trial');

insert into public.projects (owner, title, description, therapy_area, phase, budget)
select null, 'Rare Disease Observational Study', 'Natural history registry setup', 'rare-disease', 'observational', 500000
where not exists (select 1 from public.projects where title = 'Rare Disease Observational Study');

-- ===== Matches (project ↔ CRO with score) =====
-- “insert-if-missing” seed pattern(insert once)
insert into public.matches (project_id, cro_id, score)
select p.id, c.id, 0.88
from public.projects p
join public.cros c on c.name = 'PPD'
where p.title = 'Phase II Oncology Study'
  and not exists (select 1 from public.matches m where m.project_id = p.id and m.cro_id = c.id);

insert into public.matches (project_id, cro_id, score)
select p.id, c.id, 0.91
from public.projects p
join public.cros c on c.name = 'IQVIA'
where p.title = 'Phase III Cardiology Trial'
  and not exists (select 1 from public.matches m where m.project_id = p.id and m.cro_id = c.id);

insert into public.matches (project_id, cro_id, score)
select p.id, c.id, 0.86
from public.projects p
join public.cros c on c.name = 'ICON'
where p.title = 'Rare Disease Observational Study'
  and not exists (select 1 from public.matches m where m.project_id = p.id and m.cro_id = c.id);

-- ===== User Profiles (linked to auth.users) =====
-- Create profiles ONLY if the auth users exist
insert into public.user_profiles (id, full_name, email, role)
select u.id, 'Sponsor User', u.email, 'sponsor'
from auth.users u
where u.email = 'sponsor@crofinder.test'
  and not exists (select 1 from public.user_profiles p where p.id = u.id);

insert into public.user_profiles (id, full_name, email, role)
select u.id, 'CRO User', u.email, 'cro'
from auth.users u
where u.email = 'cro@crofinder.test'
  and not exists (select 1 from public.user_profiles p where p.id = u.id);

-- ===== Contacts (messages; visible only to sender/recipient due to RLS) =====
-- One message on the Oncology project from Sponsor -> CRO
insert into public.contacts (sender, recipient, project_id, message)
select s.id, r.id, p.id, 'Hello! Are you available to discuss the oncology study?'
from auth.users s
join auth.users r on r.email = 'cro@crofinder.test'
join public.projects p on p.title = 'Phase II Oncology Study'
where s.email = 'sponsor@crofinder.test'
  and not exists (
    select 1 from public.contacts c
    where c.sender = s.id and c.recipient = r.id and c.project_id = p.id
  );
