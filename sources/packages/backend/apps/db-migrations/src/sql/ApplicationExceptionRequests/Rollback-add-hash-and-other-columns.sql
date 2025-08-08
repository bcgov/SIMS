ALTER TABLE
    sims.application_exception_requests DROP COLUMN exception_description,
    DROP COLUMN approval_exception_request_id,
    DROP COLUMN exception_hash;

-- Recreate the original unique constraint on application_exception_id and exception_name.
ALTER TABLE
    sims.application_exception_requests
ADD
    CONSTRAINT application_exception_request_application_exception_id_exce_key UNIQUE (application_exception_id, exception_name);