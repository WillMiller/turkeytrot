-- Migration to allow NULL bib_number for self-registered participants
-- Admin will assign bib numbers before race day

ALTER TABLE race_participants
ALTER COLUMN bib_number DROP NOT NULL;

-- Add comment to clarify the column purpose
COMMENT ON COLUMN race_participants.bib_number IS 'Bib number assigned by admin. NULL until assigned.';
