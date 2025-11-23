-- Add text_content column to summaries table for regeneration feature
ALTER TABLE public.summaries 
ADD COLUMN IF NOT EXISTS text_content TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS summaries_text_content_idx ON public.summaries(id) WHERE text_content IS NOT NULL;
