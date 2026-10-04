-- Access-rule tests for 028 (spec §7.10 rules 4, 5, 6). STAGING only:
--   psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/access_rules_028.sql
-- Cast: A = public profile with a normal and an anonymous post. B = hidden profile. C = public profile.
BEGIN;
INSERT INTO auth.users (id, email) VALUES ('aaaaaaaa-0000-0000-0000-000000000001','a@t.l'),('bbbbbbbb-0000-0000-0000-000000000002','b@t.l'),('cccccccc-0000-0000-0000-000000000003','c@t.l');
INSERT INTO public.users (id, display_name, phone_number, email, profile_visibility, current_level, business_type) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001','Ada','+2348030000001','a-secret@t.l','public',2,'food_seller'),
  ('bbbbbbbb-0000-0000-0000-000000000002','Bayo','+2348030000002','b-secret@t.l','hidden',1,'other'),
  ('cccccccc-0000-0000-0000-000000000003','Chi','+2348030000003','c-secret@t.l','public',3,'other');
INSERT INTO public.posts (id, author_id, type, body, anonymous) VALUES
  ('a0000000-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','win','Ada normal post', false),
  ('a0000000-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001','struggle','Ada anonymous post', true),
  ('b0000000-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002','update','Bayo named post (hidden profile)', false),
  ('b0000000-0000-0000-0000-000000000002','bbbbbbbb-0000-0000-0000-000000000002','question','Bayo anonymous question', true);
INSERT INTO public.comments (post_id, author_id, body, anonymous) VALUES
  ('a0000000-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000003','Chi named comment', false),
  ('a0000000-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000003','Chi anonymous comment', true);

-- ── As C (a stranger) ────────────────────────────────────────────────────────
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"cccccccc-0000-0000-0000-000000000003","role":"authenticated"}',true);
DO $$ DECLARE r record; n int; BEGIN
  -- Base tables: C sees nothing of A's.
  SELECT count(*) INTO n FROM public.posts WHERE author_id = 'aaaaaaaa-0000-0000-0000-000000000001'; IF n <> 0 THEN RAISE EXCEPTION 'LEAK: C read A''s base posts'; END IF;
  SELECT count(*) INTO n FROM public.users WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001'; IF n <> 0 THEN RAISE EXCEPTION 'LEAK: C read A''s users row'; END IF;
  SELECT count(*) INTO n FROM public.reports; IF n <> 0 THEN RAISE EXCEPTION 'LEAK: reports are readable'; END IF;

  -- Feed: A's normal and anonymous posts are visible; B's named post (hidden profile) is NOT; B's anonymous post IS.
  SELECT count(*) INTO n FROM public.posts_public WHERE body = 'Ada normal post'; IF n <> 1 THEN RAISE EXCEPTION 'A normal post should be visible'; END IF;
  SELECT count(*) INTO n FROM public.posts_public WHERE body = 'Bayo named post (hidden profile)'; IF n <> 0 THEN RAISE EXCEPTION 'LEAK: hidden-profile named post is visible'; END IF;
  SELECT count(*) INTO n FROM public.posts_public WHERE body = 'Bayo anonymous question'; IF n <> 1 THEN RAISE EXCEPTION 'anonymous post from hidden profile should be visible'; END IF;

  -- Anonymous posts reveal nothing about the author.
  SELECT * INTO r FROM public.posts_public WHERE body = 'Ada anonymous post';
  IF r.author_id IS NOT NULL OR r.author_name IS NOT NULL OR r.author_avatar IS NOT NULL OR r.author_business_type IS NOT NULL THEN RAISE EXCEPTION 'LEAK: anonymous post exposes its author'; END IF;
  IF r.is_mine THEN RAISE EXCEPTION 'is_mine wrong'; END IF;
  SELECT * INTO r FROM public.comments_public WHERE body = 'Chi anonymous comment'; -- C's own anonymous comment: still anonymous in the view
  IF r.author_id IS NOT NULL OR r.author_name IS NOT NULL THEN RAISE EXCEPTION 'LEAK: anonymous comment exposes its author'; END IF;

  -- Profiles: only public ones, and no private columns exist on the views at all.
  SELECT count(*) INTO n FROM public.profiles_public WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001'; IF n <> 1 THEN RAISE EXCEPTION 'public profile should be visible'; END IF;
  SELECT count(*) INTO n FROM public.profiles_public WHERE id = 'bbbbbbbb-0000-0000-0000-000000000002'; IF n <> 0 THEN RAISE EXCEPTION 'LEAK: hidden profile is visible'; END IF;
  -- Allow-list: each public view has EXACTLY these columns. Anything extra (under any name) fails the test.
  IF (SELECT array_agg(column_name::text ORDER BY column_name) FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles_public')
     IS DISTINCT FROM ARRAY['avatar_url','bio','business_type','created_at','current_level','display_name','id','is_me','state'] THEN RAISE EXCEPTION 'LEAK: profiles_public columns changed'; END IF;
  IF (SELECT array_agg(column_name::text ORDER BY column_name) FROM information_schema.columns WHERE table_schema='public' AND table_name='posts_public')
     IS DISTINCT FROM ARRAY['anonymous','attachment','audience','author_avatar','author_business_type','author_id','author_level','author_name','body','comment_count','created_at','id','is_mine','media_urls','reaction_count','topic','type'] THEN RAISE EXCEPTION 'LEAK: posts_public columns changed'; END IF;
  IF (SELECT array_agg(column_name::text ORDER BY column_name) FROM information_schema.columns WHERE table_schema='public' AND table_name='comments_public')
     IS DISTINCT FROM ARRAY['anonymous','author_avatar','author_id','author_name','body','created_at','id','is_helpful','is_mine','parent_id','post_id'] THEN RAISE EXCEPTION 'LEAK: comments_public columns changed'; END IF;

  -- No join path to private tables: money, journey and Spal memory stay owner-only.
  SELECT count(*) INTO n FROM public.records; IF n <> 0 THEN RAISE EXCEPTION 'LEAK: records readable'; END IF;
  SELECT count(*) INTO n FROM public.moments; IF n <> 0 THEN RAISE EXCEPTION 'LEAK: moments readable'; END IF;
  SELECT count(*) INTO n FROM public.spal_memory; IF n <> 0 THEN RAISE EXCEPTION 'LEAK: spal_memory readable'; END IF;

  -- Cannot post as someone else, and cannot post a 4th photo.
  BEGIN INSERT INTO public.posts (author_id, type, body) VALUES ('aaaaaaaa-0000-0000-0000-000000000001','update','forged'); RAISE EXCEPTION 'LEAK: posted as A';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN NULL; END;
  BEGIN INSERT INTO public.posts (author_id, type, body, media_urls) VALUES ('cccccccc-0000-0000-0000-000000000003','update','x', ARRAY['a','b','c','d']); RAISE EXCEPTION 'media limit not enforced';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

-- ── Blocking works in both directions, including for anonymous posts ──────────
INSERT INTO public.blocks (blocker_id, blocked_id) VALUES ('cccccccc-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000001');
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM public.posts_public WHERE body LIKE 'Ada%'; IF n <> 0 THEN RAISE EXCEPTION 'blocked author still visible to blocker (incl. anonymous)'; END IF;
  SELECT count(*) INTO n FROM public.profiles_public WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001'; IF n <> 0 THEN RAISE EXCEPTION 'blocked profile visible'; END IF;
END $$;
RESET ROLE; SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}',true);
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM public.profiles_public WHERE id = 'cccccccc-0000-0000-0000-000000000003'; IF n <> 0 THEN RAISE EXCEPTION 'the blocked person can still see the blocker'; END IF;
  SELECT count(*) INTO n FROM public.posts_public WHERE body = 'Ada normal post'; IF n <> 1 THEN RAISE EXCEPTION 'authors always see their own posts'; END IF;
  SELECT count(*) INTO n FROM public.comments_public WHERE body LIKE 'Chi%'; IF n <> 0 THEN RAISE EXCEPTION 'blocked commenter visible to blocked-by user'; END IF;
END $$;

-- ── Signed-out users get nothing ─────────────────────────────────────────────
RESET ROLE; SET LOCAL ROLE anon;
DO $$ BEGIN
  BEGIN PERFORM 1 FROM public.posts_public LIMIT 1; RAISE EXCEPTION 'LEAK: anon can read posts_public'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM 1 FROM public.profiles_public LIMIT 1; RAISE EXCEPTION 'LEAK: anon can read profiles_public'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
SELECT 'access rules 028 OK' AS result;
