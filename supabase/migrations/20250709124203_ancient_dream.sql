/*
  # Election System Enhancements

  1. New Tables
    - `voter_registrations` - Voter registration with identity verification
    - `electoral_committee` - Electoral committee members
    - `campaign_materials` - Candidate campaign materials
    - `vote_audit_logs` - Audit trail for votes
    - `election_results` - Compiled election results
    - `notifications` - System notifications

  2. Enhanced Tables
    - Add identity verification fields to profiles
    - Add campaign management fields to candidates
    - Add audit fields to votes

  3. Security
    - Enable RLS on all new tables
    - Add policies for role-based access
*/

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Voter registration table with identity verification
CREATE TABLE IF NOT EXISTS voter_registrations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  identity_document_url text,
  identity_document_type text CHECK (identity_document_type IN ('national_id', 'passport', 'drivers_license')),
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verified_by uuid REFERENCES profiles(id),
  verified_at timestamptz,
  rejection_reason text,
  address text,
  phone_verified boolean DEFAULT false,
  email_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Electoral committee members
CREATE TABLE IF NOT EXISTS electoral_committee (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  position text NOT NULL,
  appointed_by uuid REFERENCES profiles(id),
  appointed_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Campaign materials for candidates
CREATE TABLE IF NOT EXISTS campaign_materials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  material_type text CHECK (material_type IN ('poster', 'manifesto', 'video', 'document')),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  is_approved boolean DEFAULT false,
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Vote audit logs for transparency
CREATE TABLE IF NOT EXISTS vote_audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vote_id uuid REFERENCES votes(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('cast', 'modified', 'deleted', 'verified')),
  performed_by uuid REFERENCES profiles(id),
  ip_address inet,
  user_agent text,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Election results compilation
CREATE TABLE IF NOT EXISTS election_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id uuid REFERENCES elections(id) ON DELETE CASCADE,
  post candidate_post NOT NULL,
  total_votes integer DEFAULT 0,
  total_registered_voters integer DEFAULT 0,
  turnout_percentage decimal(5,2) DEFAULT 0,
  winner_candidate_id uuid REFERENCES candidates(id),
  results_data jsonb DEFAULT '{}',
  compiled_by uuid REFERENCES profiles(id),
  compiled_at timestamptz DEFAULT now(),
  is_final boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(election_id, post)
);

-- Add identity verification fields to profiles if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'identity_verified') THEN
    ALTER TABLE profiles ADD COLUMN identity_verified boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'voter_id') THEN
    ALTER TABLE profiles ADD COLUMN voter_id text UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address') THEN
    ALTER TABLE profiles ADD COLUMN address text;
  END IF;
END $$;

-- Add campaign fields to candidates if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'campaign_slogan') THEN
    ALTER TABLE candidates ADD COLUMN campaign_slogan text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'qualifications') THEN
    ALTER TABLE candidates ADD COLUMN qualifications text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'experience') THEN
    ALTER TABLE candidates ADD COLUMN experience text;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE voter_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE electoral_committee ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Notifications viewable by everyone"
  ON notifications FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Super admins can manage notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- RLS Policies for voter registrations
CREATE POLICY "Users can view their own voter registration"
  ON voter_registrations FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own voter registration"
  ON voter_registrations FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Electoral committee can manage voter registrations"
  ON voter_registrations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM electoral_committee ec
      JOIN profiles p ON ec.user_id = p.id
      WHERE p.user_id = auth.uid() AND ec.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- RLS Policies for electoral committee
CREATE POLICY "Electoral committee members viewable by authenticated users"
  ON electoral_committee FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Super admins can manage electoral committee"
  ON electoral_committee FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- RLS Policies for campaign materials
CREATE POLICY "Approved campaign materials viewable by authenticated users"
  ON campaign_materials FOR SELECT
  TO authenticated
  USING (is_approved = true AND is_active = true);

CREATE POLICY "Candidates can manage their own campaign materials"
  ON campaign_materials FOR ALL
  TO authenticated
  USING (
    candidate_id IN (
      SELECT c.id FROM candidates c
      JOIN profiles p ON c.user_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Electoral committee can approve campaign materials"
  ON campaign_materials FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM electoral_committee ec
      JOIN profiles p ON ec.user_id = p.id
      WHERE p.user_id = auth.uid() AND ec.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- RLS Policies for vote audit logs
CREATE POLICY "Vote audit logs viewable by electoral committee"
  ON vote_audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM electoral_committee ec
      JOIN profiles p ON ec.user_id = p.id
      WHERE p.user_id = auth.uid() AND ec.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- RLS Policies for election results
CREATE POLICY "Election results viewable by authenticated users"
  ON election_results FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Electoral committee can manage election results"
  ON election_results FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM electoral_committee ec
      JOIN profiles p ON ec.user_id = p.id
      WHERE p.user_id = auth.uid() AND ec.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_voter_registrations_user_id ON voter_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_voter_registrations_status ON voter_registrations(verification_status);
CREATE INDEX IF NOT EXISTS idx_electoral_committee_user_id ON electoral_committee(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_materials_candidate_id ON campaign_materials(candidate_id);
CREATE INDEX IF NOT EXISTS idx_vote_audit_logs_vote_id ON vote_audit_logs(vote_id);
CREATE INDEX IF NOT EXISTS idx_election_results_election_id ON election_results(election_id);
CREATE INDEX IF NOT EXISTS idx_notifications_active ON notifications(is_active, expires_at);

-- Function to update election results
CREATE OR REPLACE FUNCTION update_election_results()
RETURNS TRIGGER AS $$
BEGIN
  -- Update election results when votes are cast
  INSERT INTO election_results (election_id, post, total_votes, results_data)
  SELECT 
    NEW.election_id,
    NEW.post,
    COUNT(*),
    jsonb_build_object(
      'candidates', jsonb_agg(
        jsonb_build_object(
          'candidate_id', c.id,
          'name', p.full_name,
          'votes', COUNT(v.id)
        )
      )
    )
  FROM votes v
  JOIN candidates c ON v.candidate_id = c.id
  JOIN profiles p ON c.user_id = p.id
  WHERE v.election_id = NEW.election_id AND v.post = NEW.post
  GROUP BY v.election_id, v.post
  ON CONFLICT (election_id, post) 
  DO UPDATE SET
    total_votes = EXCLUDED.total_votes,
    results_data = EXCLUDED.results_data,
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating election results
DROP TRIGGER IF EXISTS trigger_update_election_results ON votes;
CREATE TRIGGER trigger_update_election_results
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_election_results();

-- Function to create vote audit log
CREATE OR REPLACE FUNCTION create_vote_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO vote_audit_logs (vote_id, action, performed_by, details)
  VALUES (
    NEW.id,
    'cast',
    NEW.voter_id,
    jsonb_build_object(
      'election_id', NEW.election_id,
      'candidate_id', NEW.candidate_id,
      'post', NEW.post
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote audit logging
DROP TRIGGER IF EXISTS trigger_create_vote_audit_log ON votes;
CREATE TRIGGER trigger_create_vote_audit_log
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION create_vote_audit_log();