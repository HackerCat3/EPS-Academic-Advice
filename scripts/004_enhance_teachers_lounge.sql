-- Enhanced Teachers' Lounge Schema
-- Add categories to threads table
ALTER TABLE threads ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('review', 'collaboration', 'policy', 'announcements')) DEFAULT 'collaboration';

-- Add attachments support to threads and replies
ALTER TABLE threads ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE replies ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT CHECK (target_type IN ('thread', 'reply')) NOT NULL,
  target_id UUID NOT NULL,
  reaction_type TEXT CHECK (reaction_type IN ('approve', 'disagree', 'concern')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id) -- One reaction per user per item
);

-- Create moderation votes table for enhanced voting system
CREATE TABLE IF NOT EXISTS moderation_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT CHECK (target_type IN ('thread', 'reply')) NOT NULL,
  target_id UUID NOT NULL,
  vote TEXT CHECK (vote IN ('keep', 'edit', 'delete')) NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(voter_id, target_type, target_id) -- One vote per teacher per item
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('flagged_post', 'mention', 'announcement')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID, -- ID of related thread/reply/etc
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_threads_category ON threads(category);
CREATE INDEX IF NOT EXISTS idx_reactions_target ON reactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_moderation_votes_target ON moderation_votes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- Enable RLS on new tables
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for reactions (teachers and admins can view/manage)
CREATE POLICY "Teachers can view reactions" ON reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Teachers can manage reactions" ON reactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('teacher', 'admin')
    )
  );

-- RLS policies for moderation votes (teachers and admins only)
CREATE POLICY "Teachers can view moderation votes" ON moderation_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Teachers can cast moderation votes" ON moderation_votes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('teacher', 'admin')
    )
  );

-- RLS policies for notifications (users can only see their own)
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());
