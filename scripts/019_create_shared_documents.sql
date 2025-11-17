-- Create shared_documents table for collaborative editing
CREATE TABLE IF NOT EXISTS shared_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_public BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  can_edit BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE shared_documents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can create shared documents for their own documents"
  ON shared_documents FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view their own shared documents"
  ON shared_documents FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Anyone can view public shared documents by token"
  ON shared_documents FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

CREATE POLICY "Users can update their own shared documents"
  ON shared_documents FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own shared documents"
  ON shared_documents FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shared_documents_token ON shared_documents(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_documents_document_id ON shared_documents(document_id);

-- Make documents table support public access for shared documents
CREATE POLICY "Anyone can view public documents via share"
  ON documents FOR SELECT
  TO anon, authenticated
  USING (
    is_public = true OR
    EXISTS (
      SELECT 1 FROM shared_documents
      WHERE shared_documents.document_id = documents.id
      AND shared_documents.is_public = true
    )
  );

-- Allow anyone to update shared documents if they have edit permission
CREATE POLICY "Anyone can edit shared documents with edit permission"
  ON documents FOR UPDATE
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shared_documents
      WHERE shared_documents.document_id = documents.id
      AND shared_documents.can_edit = true
      AND shared_documents.is_public = true
    )
  );
