-- 028 · Community basics (I) and settings (L). ADDITIVE ONLY; down path: supabase/down/028_down.sql.
-- Needs 026 (users.display_name, current_level). Privacy is enforced HERE (spec §7.10), not in the UI:
--   * clients never read community base tables other than their own rows; they read the *_public views;
--   * the views expose no phone, email, money or private-journey data, and null the author of anonymous posts;
--   * blocked users vanish from each other's views, in both directions.

-- ── users: community + settings fields ───────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS bio text,
  -- Existing users have not opted in to being seen: everyone starts hidden. They choose to go public.
  ADD COLUMN IF NOT EXISTS profile_visibility text NOT NULL DEFAULT 'hidden' CHECK (profile_visibility IN ('public','connections','hidden')),
  ADD COLUMN IF NOT EXISTS anonymous_default boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_amounts_in_notifications boolean NOT NULL DEFAULT false;

-- ── posts, comments, reactions, saves ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid UNIQUE,
  author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('update','win','struggle','question','milestone')),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  media_urls text[] NOT NULL DEFAULT '{}' CHECK (cardinality(media_urls) <= 3),
  attachment jsonb,                         -- curated milestone/moment card; never raw numbers
  audience text NOT NULL DEFAULT 'public' CHECK (audience IN ('public','connections','circle')),
  circle_id uuid,
  anonymous boolean NOT NULL DEFAULT false,
  author_level smallint CHECK (author_level BETWEEN 0 AND 5),   -- snapshot at posting time
  topic text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS posts_feed_idx ON public.posts (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS posts_author_idx ON public.posts (author_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  anonymous boolean NOT NULL DEFAULT false,
  is_helpful boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS comments_post_idx ON public.comments (post_id, created_at) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.reactions (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'cheer' CHECK (kind IN ('cheer','relate','insight')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)            -- one reaction per person per post
);
CREATE TABLE IF NOT EXISTS public.saves (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('post')),
  item_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_type, item_id)
);

-- ── safety: reports and blocks ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('post','comment','user')),
  target_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN ('spam','harassment','scam','private_info','inappropriate','other')),
  details text CHECK (char_length(details) <= 500),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','actioned','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.blocks (
  blocker_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

-- ── settings: notification prefs, deletion requests, feedback ────────────────
CREATE TABLE IF NOT EXISTS public.notification_prefs (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('spal','journey','community','reminders')),
  enabled boolean NOT NULL DEFAULT true,
  quiet_start time NOT NULL DEFAULT '21:00',   -- Africa/Lagos
  quiet_end time NOT NULL DEFAULT '07:00',
  PRIMARY KEY (user_id, category)
);
CREATE TABLE IF NOT EXISTS public.account_deletions (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  purge_after timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  cancelled_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('feedback','bug','support')),
  message text NOT NULL CHECK (char_length(message) BETWEEN 3 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- notifications (legacy table): category + deep link so every notification can be grouped and opened (C04)
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS category text CHECK (category IN ('spal','journey','community','reminders')),
  ADD COLUMN IF NOT EXISTS deep_link text;

-- ── updated_at triggers (function from 026) ──────────────────────────────────
DROP TRIGGER IF EXISTS posts_touch ON public.posts;
CREATE TRIGGER posts_touch BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── Row Level Security on base tables: own rows only ─────────────────────────
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS posts_own ON public.posts;
CREATE POLICY posts_own ON public.posts FOR ALL USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS comments_own ON public.comments;
CREATE POLICY comments_own ON public.comments FOR ALL USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reactions_own ON public.reactions;
CREATE POLICY reactions_own ON public.reactions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS saves_own ON public.saves;
CREATE POLICY saves_own ON public.saves FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS blocks_own ON public.blocks;
CREATE POLICY blocks_own ON public.blocks FOR ALL USING (blocker_id = auth.uid()) WITH CHECK (blocker_id = auth.uid());
-- Reports: you can file one, you can never read them (moderators use the service role).
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reports_insert ON public.reports;
CREATE POLICY reports_insert ON public.reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notification_prefs_own ON public.notification_prefs;
CREATE POLICY notification_prefs_own ON public.notification_prefs FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
ALTER TABLE public.account_deletions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS account_deletions_own ON public.account_deletions;
CREATE POLICY account_deletions_own ON public.account_deletions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS feedback_insert ON public.feedback;
CREATE POLICY feedback_insert ON public.feedback FOR INSERT WITH CHECK (user_id = auth.uid());

-- ── Public views: the ONLY way clients read other people's community content ─
-- Views run with the owner's rights, so every filter below is the access rule. They select no private column.
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT u.id,
       COALESCE(NULLIF(u.display_name, ''), NULLIF(split_part(COALESCE(u.full_name, ''), ' ', 1), ''), 'Spal member') AS display_name,
       u.avatar_url, u.bio, u.current_level, u.state, u.business_type, u.created_at,
       (u.id = auth.uid()) AS is_me
FROM public.users u
WHERE (u.profile_visibility = 'public' OR u.id = auth.uid())
  AND NOT EXISTS (SELECT 1 FROM public.blocks b WHERE (b.blocker_id = auth.uid() AND b.blocked_id = u.id) OR (b.blocker_id = u.id AND b.blocked_id = auth.uid()));

CREATE OR REPLACE VIEW public.posts_public AS
SELECT p.id, p.type, p.body, p.media_urls, p.attachment, p.audience, p.anonymous, p.author_level, p.topic, p.created_at,
       CASE WHEN p.anonymous THEN NULL ELSE p.author_id END AS author_id,
       CASE WHEN p.anonymous THEN NULL ELSE COALESCE(NULLIF(u.display_name, ''), NULLIF(split_part(COALESCE(u.full_name, ''), ' ', 1), ''), 'Spal member') END AS author_name,
       CASE WHEN p.anonymous THEN NULL ELSE u.avatar_url END AS author_avatar,
       CASE WHEN p.anonymous THEN NULL ELSE u.business_type END AS author_business_type,
       (p.author_id = auth.uid()) AS is_mine,
       (SELECT count(*) FROM public.reactions r WHERE r.post_id = p.id) AS reaction_count,
       (SELECT count(*) FROM public.comments c WHERE c.post_id = p.id AND c.deleted_at IS NULL) AS comment_count
FROM public.posts p
JOIN public.users u ON u.id = p.author_id
WHERE p.deleted_at IS NULL
  AND (p.author_id = auth.uid() OR (p.audience = 'public' AND (p.anonymous OR u.profile_visibility = 'public')))
  AND NOT EXISTS (SELECT 1 FROM public.blocks b WHERE (b.blocker_id = auth.uid() AND b.blocked_id = p.author_id) OR (b.blocker_id = p.author_id AND b.blocked_id = auth.uid()));

CREATE OR REPLACE VIEW public.comments_public AS
SELECT c.id, c.post_id, c.parent_id, c.body, c.is_helpful, c.anonymous, c.created_at,
       CASE WHEN c.anonymous THEN NULL ELSE c.author_id END AS author_id,
       CASE WHEN c.anonymous THEN NULL ELSE COALESCE(NULLIF(u.display_name, ''), NULLIF(split_part(COALESCE(u.full_name, ''), ' ', 1), ''), 'Spal member') END AS author_name,
       CASE WHEN c.anonymous THEN NULL ELSE u.avatar_url END AS author_avatar,
       (c.author_id = auth.uid()) AS is_mine
FROM public.comments c
JOIN public.users u ON u.id = c.author_id
WHERE c.deleted_at IS NULL
  AND EXISTS (SELECT 1 FROM public.posts_public pp WHERE pp.id = c.post_id)
  AND NOT EXISTS (SELECT 1 FROM public.blocks b WHERE (b.blocker_id = auth.uid() AND b.blocked_id = c.author_id) OR (b.blocker_id = c.author_id AND b.blocked_id = auth.uid()));

-- Signed-in users only. Supabase grants new objects to `anon` by default, so revoke it explicitly.
REVOKE ALL ON public.profiles_public, public.posts_public, public.comments_public FROM anon, PUBLIC;
GRANT SELECT ON public.profiles_public, public.posts_public, public.comments_public TO authenticated, service_role;
