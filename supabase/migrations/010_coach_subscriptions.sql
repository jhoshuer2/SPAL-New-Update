-- ─────────────────────────────────────────────────────────────────────────────
-- Per-coach subscriptions and payments
--
-- Each premium voice coach (Tunde, Aisha, Bolaji, Halima) is sold individually
-- at ₦2,500/month. A user can subscribe to one or several. We track:
--   • coach_subscriptions — one row per user × coach showing active state + renewal
--   • coach_payments       — every charge (success/refund) for receipts in /billing
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.coach_subscriptions (
  id                          uuid          primary key default gen_random_uuid(),
  user_id                     uuid          not null references public.users(id) on delete cascade,
  coach_id                    text          not null,
  status                      text          not null default 'active' check (status in ('active', 'cancelled', 'expired')),
  paystack_customer_code      text,
  paystack_authorization_code text,
  paystack_subscription_code  text,
  amount                      integer       not null default 0,   -- kobo per period
  started_at                  timestamptz   not null default now(),
  current_period_end          timestamptz   not null,
  cancelled_at                timestamptz,
  created_at                  timestamptz   not null default now(),
  updated_at                  timestamptz   not null default now(),
  unique (user_id, coach_id)
);

create index if not exists coach_subscriptions_user_idx on public.coach_subscriptions(user_id);
create index if not exists coach_subscriptions_status_idx on public.coach_subscriptions(status);

alter table public.coach_subscriptions enable row level security;

create policy "coach_subs_owner" on public.coach_subscriptions
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.coach_payments (
  id                  uuid          primary key default gen_random_uuid(),
  user_id             uuid          not null references public.users(id) on delete cascade,
  coach_id            text          not null,
  paystack_reference  text          not null unique,
  amount              integer       not null,           -- kobo charged
  status              text          not null check (status in ('succeeded', 'failed', 'refunded')),
  paid_at             timestamptz   not null default now(),
  created_at          timestamptz   not null default now()
);

create index if not exists coach_payments_user_idx on public.coach_payments(user_id);
create index if not exists coach_payments_paid_idx on public.coach_payments(paid_at desc);

alter table public.coach_payments enable row level security;

create policy "coach_payments_owner" on public.coach_payments
  for all using (auth.uid() = user_id);
