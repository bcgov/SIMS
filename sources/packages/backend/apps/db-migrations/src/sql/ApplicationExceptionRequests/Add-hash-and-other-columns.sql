ALTER TABLE
  sims.application_exception_requests
ADD
  COLUMN exception_index SMALLINT DEFAULT 0,
ADD
  COLUMN exception_description VARCHAR(1000),
ADD
  COLUMN approval_exception_id INT REFERENCES sims.application_exception_requests(id),
ADD
  COLUMN exception_hash CHAR(64);

COMMENT ON COLUMN sims.application_exception_requests.exception_index IS 'Index used for exceptions that can happen multiple times, for instance, dependents lists or parents list.';

COMMENT ON COLUMN sims.application_exception_requests.exception_description IS 'Description of the application exception. Critical for exceptions that happens multiple times to allow its individual identification.';

COMMENT ON COLUMN sims.application_exception_requests.approval_exception_id IS 'Reference to a previously approved exception request that was considered to have the same content, which includes also associated files.';

COMMENT ON COLUMN sims.application_exception_requests.exception_hash IS 'Hash of the application exception data, which also include files names and content hashes.';

-- Create unique index on exception_index, application_exception_id, and exception_name
CREATE UNIQUE INDEX idx_application_exception_requests_unique_combination ON sims.application_exception_requests (
  application_exception_id,
  exception_name,
  exception_index
);