create extension if not exists vector;

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  raw_text text not null,
  summary text,
  type text not null default 'note',
  tags text[] not null default '{}',
  entities jsonb,
  embedding vector(384),
  mood text,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create index if not exists entries_created_at_idx on entries (created_at desc);
create index if not exists entries_type_idx on entries (type);
create index if not exists entries_tags_idx on entries using gin (tags);
create index if not exists entries_embedding_idx
  on entries using hnsw (embedding vector_cosine_ops);

create or replace function match_entries(
  query_embedding vector(384),
  match_threshold float default 0.0,
  match_count int default 20
)
returns table (
  id uuid,
  raw_text text,
  summary text,
  type text,
  tags text[],
  entities jsonb,
  mood text,
  pinned boolean,
  created_at timestamptz,
  last_seen_at timestamptz,
  similarity float
)
language sql stable
as $$
  select
    e.id, e.raw_text, e.summary, e.type, e.tags, e.entities,
    e.mood, e.pinned, e.created_at, e.last_seen_at,
    1 - (e.embedding <=> query_embedding) as similarity
  from entries e
  where e.embedding is not null
    and 1 - (e.embedding <=> query_embedding) > match_threshold
  order by e.embedding <=> query_embedding
  limit match_count;
$$;
