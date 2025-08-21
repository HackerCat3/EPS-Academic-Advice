-- Create profiles table that references auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('student', 'teacher', 'admin')) NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_own_and_public_fields"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR TRUE); -- Allow viewing public fields of all users

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create threads table
CREATE TABLE IF NOT EXISTS public.threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  visibility TEXT CHECK (visibility IN ('public', 'teachers_only')) NOT NULL DEFAULT 'public',
  status TEXT CHECK (status IN ('open', 'locked')) NOT NULL DEFAULT 'open',
  is_pending BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on threads
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;

-- Threads policies
CREATE POLICY "threads_select_public_or_teachers"
  ON public.threads FOR SELECT
  USING (
    (visibility = 'public' AND is_pending = FALSE) OR 
    (visibility = 'teachers_only' AND is_pending = FALSE AND 
     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')))
  );

CREATE POLICY "threads_insert_authenticated"
  ON public.threads FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    (visibility = 'public' OR 
     (visibility = 'teachers_only' AND 
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))))
  );

CREATE POLICY "threads_update_author_or_moderator"
  ON public.threads FOR UPDATE
  USING (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

CREATE POLICY "threads_delete_author_or_moderator"
  ON public.threads FOR DELETE
  USING (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- Create replies table
CREATE TABLE IF NOT EXISTS public.replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  is_pending BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on replies
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;

-- Replies policies
CREATE POLICY "replies_select_if_thread_visible"
  ON public.replies FOR SELECT
  USING (
    is_pending = FALSE AND
    EXISTS (
      SELECT 1 FROM public.threads t 
      WHERE t.id = thread_id AND
      ((t.visibility = 'public') OR 
       (t.visibility = 'teachers_only' AND 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))))
    )
  );

CREATE POLICY "replies_insert_authenticated"
  ON public.replies FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.threads t 
      WHERE t.id = thread_id AND t.status = 'open' AND
      ((t.visibility = 'public') OR 
       (t.visibility = 'teachers_only' AND 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))))
    )
  );

CREATE POLICY "replies_update_author_or_moderator"
  ON public.replies FOR UPDATE
  USING (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

CREATE POLICY "replies_delete_author_or_moderator"
  ON public.replies FOR DELETE
  USING (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- Create moderation_events table
CREATE TABLE IF NOT EXISTS public.moderation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id),
  action TEXT CHECK (action IN ('delete', 'lock', 'unlock', 'approve', 'reject')) NOT NULL,
  target_type TEXT CHECK (target_type IN ('thread', 'reply')) NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on moderation_events
ALTER TABLE public.moderation_events ENABLE ROW LEVEL SECURITY;

-- Moderation events policies
CREATE POLICY "moderation_events_select_moderators"
  ON public.moderation_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')));

CREATE POLICY "moderation_events_insert_moderators"
  ON public.moderation_events FOR INSERT
  WITH CHECK (
    auth.uid() = actor_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- Create flags table
CREATE TABLE IF NOT EXISTS public.flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT CHECK (target_type IN ('thread', 'reply')) NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_by UUID REFERENCES public.profiles(id),
  resolution TEXT CHECK (resolution IN ('approved', 'rejected')),
  resolved_at TIMESTAMPTZ
);

-- Enable RLS on flags
ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;

-- Flags policies
CREATE POLICY "flags_select_moderators"
  ON public.flags FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')));

CREATE POLICY "flags_insert_system"
  ON public.flags FOR INSERT
  WITH CHECK (TRUE); -- System can create flags

CREATE POLICY "flags_update_moderators"
  ON public.flags FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_threads_visibility_pending ON public.threads(visibility, is_pending);
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON public.threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_replies_thread_id ON public.replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_replies_created_at ON public.replies(created_at);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_threads_search ON public.threads 
USING GIN (to_tsvector('english', title || ' ' || body));
