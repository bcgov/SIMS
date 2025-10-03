CREATE TYPE sims.application_exception_request_status AS ENUM ('Pending', 'Approved', 'Declined');

COMMENT ON TYPE sims.application_exception_request_status IS 'Status values of an application exception request.';