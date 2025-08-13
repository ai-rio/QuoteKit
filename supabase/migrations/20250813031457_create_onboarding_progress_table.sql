-- Create the onboarding_progress table that matches the onboarding context expectations
-- This table stores consolidated onboarding progress data as expected by the frontend

CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  has_seen_welcome BOOLEAN DEFAULT false,
  completed_tours TEXT[] DEFAULT '{}',
  skipped_tours TEXT[] DEFAULT '{}',
  active_tour_id TEXT,
  active_tour_step INTEGER DEFAULT 0,
  tour_progresses JSONB DEFAULT '{}',
  session_count INTEGER DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_onboarding_progress_user_id ON onboarding_progress(user_id);
CREATE INDEX idx_onboarding_progress_active_tour ON onboarding_progress(active_tour_id);
CREATE INDEX idx_onboarding_progress_last_active ON onboarding_progress(last_active_at);

-- Enable Row Level Security (RLS)
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own onboarding progress" ON onboarding_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding progress" ON onboarding_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress" ON onboarding_progress
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own onboarding progress" ON onboarding_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Admin policy for viewing all progress
CREATE POLICY "Admins can view all onboarding progress" ON onboarding_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Function to automatically update the updated_at timestamp
CREATE TRIGGER update_onboarding_progress_updated_at
    BEFORE UPDATE ON onboarding_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE onboarding_progress IS 'Consolidated onboarding progress data matching frontend context expectations';
COMMENT ON COLUMN onboarding_progress.user_id IS 'Reference to the user this progress belongs to';
COMMENT ON COLUMN onboarding_progress.has_seen_welcome IS 'Whether the user has seen the welcome screen';
COMMENT ON COLUMN onboarding_progress.completed_tours IS 'Array of completed tour IDs';
COMMENT ON COLUMN onboarding_progress.skipped_tours IS 'Array of skipped tour IDs';
COMMENT ON COLUMN onboarding_progress.active_tour_id IS 'ID of currently active tour, if any';
COMMENT ON COLUMN onboarding_progress.active_tour_step IS 'Current step in the active tour';
COMMENT ON COLUMN onboarding_progress.tour_progresses IS 'JSONB object containing detailed progress for each tour';
COMMENT ON COLUMN onboarding_progress.session_count IS 'Number of sessions this user has had';