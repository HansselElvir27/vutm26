-- Add 'submitted' status to arrivals table
ALTER TABLE arrivals DROP CONSTRAINT arrivals_status_check;
ALTER TABLE arrivals ADD CONSTRAINT arrivals_status_check CHECK (status IN ('pending', 'submitted', 'approved_by_captain', 'documents_complete', 'ready_for_zarpe', 'zarpe_approved', 'completed'));
