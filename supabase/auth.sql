create table if not exists audit_log (
  id bigserial primary key,
  ts timestamptz not null default now(),
  event text not null,
  ip text,
  ua text,
  entry_id uuid,
  meta jsonb
);

create index if not exists audit_log_ts_idx on audit_log (ts desc);
create index if not exists audit_log_event_idx on audit_log (event);

create table if not exists login_attempts (
  id bigserial primary key,
  ip text not null,
  success boolean not null,
  ts timestamptz not null default now()
);

create index if not exists login_attempts_ip_ts_idx on login_attempts (ip, ts desc);

create table if not exists session_state (
  id int primary key default 1,
  version int not null default 1,
  updated_at timestamptz not null default now(),
  constraint session_state_singleton check (id = 1)
);

insert into session_state (id, version) values (1, 1)
  on conflict (id) do nothing;

alter table entries enable row level security;
alter table audit_log enable row level security;
alter table login_attempts enable row level security;
alter table session_state enable row level security;
