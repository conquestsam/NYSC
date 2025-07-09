/*
  # NYSC Toru-Orua Portal Database Schema

  1. New Tables
    - `profiles` - User profiles with detailed information
    - `hero_slides` - Dynamic hero section images
    - `job_scholarships` - Job and scholarship listings
    - `activities` - CDS and other activities
    - `about_sections` - About Us page sections
    - `photo_gallery` - Event-tagged photo gallery
    - `elections` - Election management
    - `candidates` - Election candidates
    - `votes` - Voting records
    - `suggestions` - Anonymous suggestions
    - `suggestion_reactions` - Gamified reactions

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users and role-based access
    - Prevent data tampering with proper constraints

  3. Indexes
    - Performance optimization for frequently queried columns
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('voter', 'candidate', 'executive', 'super_admin');
CREATE TYPE election_status AS ENUM ('upcoming', 'active', 'completed');
CREATE TYPE candidate_post AS ENUM ('clo', 'cds_president', 'financial_secretary', 'general_secretary', 'marshall_male', 'marshall_female', 'provost');

-- User profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  photo_url text,
  date_of_birth date,
  institution text,
  course text,
  state_code text,
  phone text,
  ppa text,
  department text,
  bio text,
  role user_role DEFAULT 'voter',
  is_graduated boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Hero slides table
CREATE TABLE IF NOT EXISTS hero_slides (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Job and scholarship listings
CREATE TABLE IF NOT EXISTS job_scholarships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  image_url text,
  external_link text,
  deadline date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  image_url text,
  images jsonb DEFAULT '[]',
  activity_date date,
  category text NOT NULL, -- 'cds', 'pop', 'saed', etc.
  status text DEFAULT 'upcoming', -- 'past', 'ongoing', 'upcoming'
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- About Us sections
CREATE TABLE IF NOT EXISTS about_sections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_type text NOT NULL, -- 'lgi', 'current_officials', 'past_achievements'
  title text NOT NULL,
  description text,
  image_url text,
  name text,
  position text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Photo gallery
CREATE TABLE IF NOT EXISTS photo_gallery (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  event_tag text NOT NULL,
  upload_date date DEFAULT CURRENT_DATE,
  uploaded_by uuid REFERENCES profiles(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Elections table
CREATE TABLE IF NOT EXISTS elections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status election_status DEFAULT 'upcoming',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id uuid REFERENCES elections(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  post candidate_post NOT NULL,
  manifesto text,
  is_approved boolean DEFAULT false,
  votes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(election_id, user_id, post)
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id uuid REFERENCES elections(id) ON DELETE CASCADE,
  voter_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  post candidate_post NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(election_id, voter_id, post)
);

-- Anonymous suggestions
CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  content text NOT NULL,
  category text DEFAULT 'general',
  is_anonymous boolean DEFAULT true,
  reactions_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Suggestion reactions
CREATE TABLE IF NOT EXISTS suggestion_reactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion_id uuid REFERENCES suggestions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(suggestion_id, user_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestion_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- RLS Policies for public content (viewable by all)
CREATE POLICY "Hero slides are viewable by everyone"
  ON hero_slides FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Job scholarships are viewable by everyone"
  ON job_scholarships FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Activities are viewable by everyone"
  ON activities FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "About sections are viewable by everyone"
  ON about_sections FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- RLS Policies for photo gallery (authenticated users only)
CREATE POLICY "Photo gallery viewable by authenticated users"
  ON photo_gallery FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for elections (authenticated users only)
CREATE POLICY "Elections viewable by authenticated users"
  ON elections FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Candidates viewable by authenticated users"
  ON candidates FOR SELECT
  TO authenticated
  USING (is_approved = true);

-- RLS Policies for voting (authenticated users only)
CREATE POLICY "Users can view their own votes"
  ON votes FOR SELECT
  TO authenticated
  USING (
    voter_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own votes"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (
    voter_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for suggestions
CREATE POLICY "Suggestions viewable by authenticated users"
  ON suggestions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create suggestions"
  ON suggestions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Suggestion reactions viewable by authenticated users"
  ON suggestion_reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own reactions"
  ON suggestion_reactions FOR ALL
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Super admin policies for content management
CREATE POLICY "Super admins can manage hero slides"
  ON hero_slides FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage job scholarships"
  ON job_scholarships FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage activities"
  ON activities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage about sections"
  ON about_sections FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage photo gallery"
  ON photo_gallery FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage elections"
  ON elections FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage candidates"
  ON candidates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_hero_slides_active ON hero_slides(is_active, display_order);
CREATE INDEX idx_job_scholarships_active ON job_scholarships(is_active);
CREATE INDEX idx_activities_category ON activities(category, is_active);
CREATE INDEX idx_photo_gallery_tag ON photo_gallery(event_tag, is_active);
CREATE INDEX idx_elections_status ON elections(status, is_active);
CREATE INDEX idx_candidates_election ON candidates(election_id, post);
CREATE INDEX idx_votes_election ON votes(election_id, post);
CREATE INDEX idx_suggestions_created ON suggestions(created_at DESC);

-- Create functions for vote counting
CREATE OR REPLACE FUNCTION update_candidate_votes()
RETURNS TRIGGER AS $$
BEGIN
  -- Update votes count for the candidate
  UPDATE candidates 
  SET votes_count = (
    SELECT COUNT(*) 
    FROM votes 
    WHERE candidate_id = NEW.candidate_id
  )
  WHERE id = NEW.candidate_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote counting
CREATE TRIGGER trigger_update_candidate_votes
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_candidate_votes();

-- Insert super admin profile function
CREATE OR REPLACE FUNCTION create_super_admin_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (
    user_id, 
    email, 
    full_name, 
    role,
    is_verified
  ) VALUES (
    NEW.id,
    NEW.email,
    'Super Administrator',
    'super_admin',
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for super admin
CREATE TRIGGER trigger_create_super_admin_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email = 'admin@toru-orua.com')
  EXECUTE FUNCTION create_super_admin_profile();