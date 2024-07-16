ALTER TABLE
  sims.student_files
ADD
  COLUMN virus_scan_status sims.virus_scan_status NOT NULL DEFAULT 'Pending';

COMMENT ON COLUMN sims.student_files.virus_scan_status IS 'Virus scan status of the file.';

ALTER TABLE
  sims.student_files
ADD
  COLUMN virus_scan_status_updated_on timestamp with time zone NOT NULL DEFAULT now();

COMMENT ON COLUMN sims.student_files.virus_scan_status_updated_on IS 'Virus scan status updated on info.';