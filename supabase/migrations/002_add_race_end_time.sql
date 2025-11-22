-- Add end_time column to races table
ALTER TABLE races
ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN races.end_time IS 'When the race was officially ended/finished';
