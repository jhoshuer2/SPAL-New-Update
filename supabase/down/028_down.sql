-- Down path for 028. Staging, or production with explicit sign-off: it deletes ALL posts, comments, reactions, saves, reports,
-- blocks, notification prefs, deletion requests and feedback.
DROP VIEW IF EXISTS public.comments_public, public.posts_public, public.profiles_public;
DROP TABLE IF EXISTS public.feedback, public.account_deletions, public.notification_prefs, public.blocks, public.reports, public.saves, public.reactions, public.comments, public.posts CASCADE;
ALTER TABLE public.notifications DROP COLUMN IF EXISTS category, DROP COLUMN IF EXISTS deep_link;
ALTER TABLE public.users DROP COLUMN IF EXISTS bio, DROP COLUMN IF EXISTS profile_visibility, DROP COLUMN IF EXISTS anonymous_default, DROP COLUMN IF EXISTS show_amounts_in_notifications;
