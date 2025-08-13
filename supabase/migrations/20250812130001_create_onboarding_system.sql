-- Create onboarding system tables for user tour progress tracking

-- User onboarding progress table
CREATE TABLE user_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tour_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')) DEFAULT 'not_started',
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, tour_id)
);

-- Onboarding analytics events table
CREATE TABLE onboarding_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tour_id TEXT NOT NULL,
  step_id TEXT,
  event_type TEXT CHECK (event_type IN ('tour_start', 'step_view', 'step_complete', 'tour_complete', 'tour_skip', 'tour_abandon', 'tour_pause', 'tour_resume')) NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User onboarding preferences table
CREATE TABLE user_onboarding_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  show_tooltips BOOLEAN DEFAULT true,
  auto_start_tours BOOLEAN DEFAULT true,
  preferred_tour_speed TEXT CHECK (preferred_tour_speed IN ('slow', 'normal', 'fast')) DEFAULT 'normal',
  skip_completed_tours BOOLEAN DEFAULT true,
  enable_animations BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_onboarding_progress_user_id ON user_onboarding_progress(user_id);
CREATE INDEX idx_user_onboarding_progress_tour_id ON user_onboarding_progress(tour_id);
CREATE INDEX idx_user_onboarding_progress_status ON user_onboarding_progress(status);
CREATE INDEX idx_user_onboarding_progress_last_active ON user_onboarding_progress(last_active_at);

CREATE INDEX idx_onboarding_analytics_user_id ON onboarding_analytics(user_id);
CREATE INDEX idx_onboarding_analytics_tour_id ON onboarding_analytics(tour_id);
CREATE INDEX idx_onboarding_analytics_event_type ON onboarding_analytics(event_type);
CREATE INDEX idx_onboarding_analytics_created_at ON onboarding_analytics(created_at);
CREATE INDEX idx_onboarding_analytics_device_type ON onboarding_analytics(device_type);

-- Enable Row Level Security (RLS)
ALTER TABLE user_onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_onboarding_progress
CREATE POLICY "Users can view their own onboarding progress" ON user_onboarding_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding progress" ON user_onboarding_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress" ON user_onboarding_progress
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own onboarding progress" ON user_onboarding_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Admin policy for viewing all progress
CREATE POLICY "Admins can view all onboarding progress" ON user_onboarding_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- RLS Policies for onboarding_analytics
CREATE POLICY "Users can insert their own analytics" ON onboarding_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own analytics" ON onboarding_analytics
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policy for viewing all analytics
CREATE POLICY "Admins can view all analytics" ON onboarding_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- RLS Policies for user_onboarding_preferences
CREATE POLICY "Users can manage their own preferences" ON user_onboarding_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admin policy for viewing all preferences
CREATE POLICY "Admins can view all preferences" ON user_onboarding_preferences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_onboarding_progress_updated_at
    BEFORE UPDATE ON user_onboarding_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_onboarding_preferences_updated_at
    BEFORE UPDATE ON user_onboarding_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get onboarding completion stats
CREATE OR REPLACE FUNCTION get_onboarding_stats(
  user_id_param UUID DEFAULT NULL,
  tour_id_param TEXT DEFAULT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  total_users INTEGER,
  completed_tours INTEGER,
  skipped_tours INTEGER,
  in_progress_tours INTEGER,
  completion_rate NUMERIC,
  average_completion_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT p.user_id)::INTEGER as total_users,
    COUNT(CASE WHEN p.status = 'completed' THEN 1 END)::INTEGER as completed_tours,
    COUNT(CASE WHEN p.status = 'skipped' THEN 1 END)::INTEGER as skipped_tours,
    COUNT(CASE WHEN p.status = 'in_progress' THEN 1 END)::INTEGER as in_progress_tours,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(CASE WHEN p.status = 'completed' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0
    END as completion_rate,
    AVG(CASE 
      WHEN p.status = 'completed' AND p.started_at IS NOT NULL AND p.completed_at IS NOT NULL 
      THEN p.completed_at - p.started_at 
    END) as average_completion_time
  FROM user_onboarding_progress p
  WHERE (user_id_param IS NULL OR p.user_id = user_id_param)
    AND (tour_id_param IS NULL OR p.tour_id = tour_id_param)
    AND p.created_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get user onboarding completion percentage
CREATE OR REPLACE FUNCTION get_user_onboarding_completion(user_id_param UUID)
RETURNS TABLE (
  total_tours INTEGER,
  completed_tours INTEGER,
  completion_percentage NUMERIC
) AS $$
DECLARE
  available_tours TEXT[] := ARRAY['welcome', 'quote-creation', 'settings', 'item-library'];
BEGIN
  RETURN QUERY
  SELECT 
    array_length(available_tours, 1) as total_tours,
    COALESCE(
      (SELECT COUNT(*)::INTEGER 
       FROM user_onboarding_progress p 
       WHERE p.user_id = user_id_param 
         AND p.status = 'completed' 
         AND p.tour_id = ANY(available_tours)
      ), 0
    ) as completed_tours,
    CASE 
      WHEN array_length(available_tours, 1) > 0 THEN
        ROUND(
          (COALESCE(
            (SELECT COUNT(*)::NUMERIC 
             FROM user_onboarding_progress p 
             WHERE p.user_id = user_id_param 
               AND p.status = 'completed' 
               AND p.tour_id = ANY(available_tours)
            ), 0
          ) / array_length(available_tours, 1)::NUMERIC) * 100, 2
        )
      ELSE 0
    END as completion_percentage;
END;
$$ LANGUAGE plpgsql;

-- Insert default preferences for existing users
INSERT INTO user_onboarding_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE user_onboarding_progress IS 'Tracks user progress through onboarding tours';
COMMENT ON TABLE onboarding_analytics IS 'Analytics events for onboarding tour interactions';
COMMENT ON TABLE user_onboarding_preferences IS 'User preferences for onboarding experience';

COMMENT ON COLUMN user_onboarding_progress.tour_id IS 'Identifier for the specific tour (welcome, quote-creation, etc.)';
COMMENT ON COLUMN user_onboarding_progress.status IS 'Current status of the tour for this user';
COMMENT ON COLUMN user_onboarding_progress.current_step IS 'Current step number in the tour (0-indexed)';
COMMENT ON COLUMN user_onboarding_progress.metadata IS 'Additional tour-specific data';

COMMENT ON COLUMN onboarding_analytics.event_type IS 'Type of analytics event being tracked';
COMMENT ON COLUMN onboarding_analytics.event_data IS 'Additional event-specific data';
COMMENT ON COLUMN onboarding_analytics.session_id IS 'Browser session identifier';

COMMENT ON FUNCTION get_onboarding_stats IS 'Returns onboarding completion statistics for analytics';
COMMENT ON FUNCTION get_user_onboarding_completion IS 'Returns completion percentage for a specific user';