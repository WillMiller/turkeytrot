-- Sausalito Turkey Trot Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT,
  last_name TEXT,
  gender TEXT,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Races table
CREATE TABLE IF NOT EXISTS races (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  race_date DATE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Race participants table (junction table with bib numbers)
CREATE TABLE IF NOT EXISTS race_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  bib_number INTEGER, -- Nullable: assigned by admin before race day
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(race_id, participant_id),
  UNIQUE(race_id, bib_number) -- NULL values don't conflict with this constraint
);

-- Finish times table
CREATE TABLE IF NOT EXISTS finish_times (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  race_participant_id UUID NOT NULL REFERENCES race_participants(id) ON DELETE CASCADE,
  finish_time TIMESTAMP WITH TIME ZONE NOT NULL,
  adjusted_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(race_participant_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_phone ON participants(phone);
CREATE INDEX IF NOT EXISTS idx_race_participants_race_id ON race_participants(race_id);
CREATE INDEX IF NOT EXISTS idx_race_participants_participant_id ON race_participants(participant_id);
CREATE INDEX IF NOT EXISTS idx_race_participants_bib_number ON race_participants(race_id, bib_number);
CREATE INDEX IF NOT EXISTS idx_finish_times_race_participant_id ON finish_times(race_participant_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_races_updated_at BEFORE UPDATE ON races
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_race_participants_updated_at BEFORE UPDATE ON race_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finish_times_updated_at BEFORE UPDATE ON finish_times
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE finish_times ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (we'll refine these later)
-- For now, allow all authenticated users to do everything
CREATE POLICY "Enable all for authenticated users" ON participants
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON races
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON race_participants
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON finish_times
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
