-- Add VTU scheme support for resources.
ALTER TABLE resources ADD COLUMN scheme TEXT DEFAULT '2021';

UPDATE resources
SET scheme = '2021'
WHERE scheme IS NULL OR scheme = '';

CREATE INDEX IF NOT EXISTS idx_resources_scheme ON resources(scheme);
