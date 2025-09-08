-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.flags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type = ANY (ARRAY['thread'::text, 'reply'::text])),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  resolved_by uuid,
  resolution text CHECK (resolution = ANY (ARRAY['approved'::text, 'rejected'::text])),
  resolved_at timestamp with time zone,
  CONSTRAINT flags_pkey PRIMARY KEY (id),
  CONSTRAINT flags_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.moderation_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL CHECK (action = ANY (ARRAY['delete'::text, 'lock'::text, 'unlock'::text, 'approve'::text, 'reject'::text])),
  target_type text NOT NULL CHECK (target_type = ANY (ARRAY['thread'::text, 'reply'::text])),
  target_id uuid NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT moderation_events_pkey PRIMARY KEY (id),
  CONSTRAINT moderation_events_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.moderation_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  voter_id uuid,
  target_type text NOT NULL CHECK (target_type = ANY (ARRAY['thread'::text, 'reply'::text])),
  target_id uuid NOT NULL,
  vote text NOT NULL CHECK (vote = ANY (ARRAY['keep'::text, 'edit'::text, 'delete'::text])),
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT moderation_votes_pkey PRIMARY KEY (id),
  CONSTRAINT moderation_votes_voter_id_fkey FOREIGN KEY (voter_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  type text NOT NULL CHECK (type = ANY (ARRAY['flagged_post'::text, 'mention'::text, 'announcement'::text])),
  title text NOT NULL,
  message text NOT NULL,
  related_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'student'::text CHECK (role = ANY (ARRAY['student'::text, 'teacher'::text, 'admin'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  target_type text NOT NULL CHECK (target_type = ANY (ARRAY['thread'::text, 'reply'::text])),
  target_id uuid NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type = ANY (ARRAY['approve'::text, 'disagree'::text, 'concern'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reactions_pkey PRIMARY KEY (id),
  CONSTRAINT reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.replies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  thread_id uuid,
  author_id uuid,
  body text NOT NULL,
  is_anonymous boolean NOT NULL DEFAULT false,
  is_pending boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  attachments jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT replies_pkey PRIMARY KEY (id),
  CONSTRAINT replies_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.threads(id),
  CONSTRAINT replies_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.threads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_id uuid,
  title text NOT NULL,
  body text NOT NULL,
  is_anonymous boolean NOT NULL DEFAULT false,
  visibility text NOT NULL DEFAULT 'public'::text CHECK (visibility = ANY (ARRAY['public'::text, 'teachers_only'::text])),
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'locked'::text])),
  is_pending boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  category text DEFAULT 'collaboration'::text CHECK (category = ANY (ARRAY['review'::text, 'collaboration'::text, 'policy'::text, 'announcements'::text])),
  attachments jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT threads_pkey PRIMARY KEY (id),
  CONSTRAINT threads_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
