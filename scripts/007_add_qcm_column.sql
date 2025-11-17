-- Add QCM column to summaries table
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS qcm jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN summaries.qcm IS 'QCM (Multiple Choice Questions) data stored as JSON array';
