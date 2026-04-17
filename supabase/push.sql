create table if not exists push_subscriptions (
  id bigserial primary key,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  ua text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists push_subscriptions_endpoint_idx on push_subscriptions (endpoint);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references entries(id) on delete cascade,
  kind text not null,
  title text,
  body text,
  fire_at timestamptz not null,
  sent_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists reminders_due_idx on reminders (fire_at)
  where sent_at is null and cancelled_at is null;

alter table push_subscriptions enable row level security;
alter table reminders enable row level security;
