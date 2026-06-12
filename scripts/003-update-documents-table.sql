-- Update documents table to support file storage

-- Drop the check constraint first
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_type_check;

-- Add new columns for file storage
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_data TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);

-- Make file_url optional since we'll use file_data
ALTER TABLE documents ALTER COLUMN file_url DROP NOT NULL;

-- Add updated check constraint with uppercase document types
ALTER TABLE documents ADD CONSTRAINT documents_document_type_check 
  CHECK (document_type IN ('NOA', 'FAL1', 'FAL2', 'FAL3', 'FAL4', 'FAL5', 'FAL6', 'FAL7', 'CARGO_MANIFEST', 'NIL_LIST', 'LAST_DEPARTURE', 'MDH', 'POC', 'OTHER'));
