CREATE TYPE sims.virus_scan_status AS ENUM (
  'Pending',
  'In-progress',
  'Virus detected',
  'File is clean'
);