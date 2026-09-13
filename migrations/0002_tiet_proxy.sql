-- TIET Proxy — student profiles, verification, requests, proofs, credits

create table if not exists profiles (
  user_id    text primary key,
  email      text not null unique,
  name       text not null,
  roll_no    text not null unique,
  branch     text not null,
  year       text not null,
  credits    integer not null default 2,
  created_at timestamptz not null default now()
);
create index if not exists profiles_roll_idx on profiles (roll_no);

create table if not exists pending_signups (
  email       text primary key,
  name        text not null,
  roll_no     text not null,
  branch      text not null,
  year        text not null,
  code_hash   text not null,
  sent_count  integer not null default 1,
  last_sent_at timestamptz not null default now(),
  verified_at timestamptz,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create table if not exists proxy_requests (
  id           serial primary key,
  requester_id text not null,
  helper_id    text,
  course_code  text not null,
  course_name  text not null,
  faculty      text not null,
  venue        text not null,
  class_date   date not null,
  slot         text not null,
  note         text not null default '',
  status       text not null default 'open',
  reject_reason text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists proxy_requests_status_idx on proxy_requests (status);
create index if not exists proxy_requests_requester_idx on proxy_requests (requester_id);
create index if not exists proxy_requests_helper_idx on proxy_requests (helper_id);

create table if not exists proofs (
  id         serial primary key,
  request_id integer not null references proxy_requests (id) on delete cascade,
  helper_id  text not null,
  image_data text not null,
  caption    text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists proofs_request_idx on proofs (request_id);

create table if not exists credit_events (
  id         serial primary key,
  user_id    text not null,
  delta      integer not null,
  reason     text not null,
  request_id integer,
  created_at timestamptz not null default now()
);
create index if not exists credit_events_user_idx on credit_events (user_id);
