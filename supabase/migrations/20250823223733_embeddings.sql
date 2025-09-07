-- Enable pgvector (safe if already enabled)
create extension if not exists vector;

-- Pick a dimension that matches your embedding model (examples):
-- 1536 = OpenAI text-embedding-3-small / ada-002
-- 3072 = OpenAI text-embedding-3-large
-- Adjust both columns below to your chosen dimension!
alter table public.cros     add column if not exists embedding vector(1536);
alter table public.projects add column if not exists embedding vector(1536);

-- =====================================================================
-- Vector indexes (cosine distance). Good default for semantic search.
-- Tuning tip: set lists ≈ sqrt(row_count), then ANALYZE after bulk loads.
-- =====================================================================
create index if not exists cros_embedding_ivfflat
  on public.cros using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists projects_embedding_ivfflat
  on public.projects using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Optional: if you expect frequent updates/deletes and want great recall,
-- HNSW can be used instead of IVFFlat (pgvector >= 0.5):
-- create index if not exists cros_embedding_hnsw
--   on public.cros using hnsw (embedding vector_cosine_ops);
-- create index if not exists projects_embedding_hnsw
--   on public.projects using hnsw (embedding vector_cosine_ops);

-- =====================================================================
-- Helpful relational indexes (non-vector) for your existing schema
-- =====================================================================
-- Foreign-key/filter/join performance
create index if not exists idx_projects_owner       on public.projects (owner);
create index if not exists idx_matches_project_id   on public.matches (project_id);
create index if not exists idx_matches_cro_id       on public.matches (cro_id);
create index if not exists idx_contacts_sender      on public.contacts (sender);
create index if not exists idx_contacts_recipient   on public.contacts (recipient);
create index if not exists idx_contacts_project_id  on public.contacts (project_id);

-- Array contains queries on CRO specialties (if you use them)
-- e.g., `where specialties @> array['oncology']`
create index if not exists idx_cros_specialties on public.cros using gin (specialties);

-- Handy sort/filter
create index if not exists idx_projects_created_at on public.projects (created_at);
create index if not exists idx_cros_created_at     on public.cros (created_at);


-- keep your 1536 column for now; add a new one for 384-dim models
alter table public.cros     add column if not exists embedding vector(384);
alter table public.projects add column if not exists embedding vector(384);

-- ANN indexes for the new column
create index if not exists cros_embedding384_ivfflat
  on public.cros using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create index if not exists projects_embedding384_ivfflat
  on public.projects using ivfflat (embedding vector_cosine_ops) with (lists = 100);

