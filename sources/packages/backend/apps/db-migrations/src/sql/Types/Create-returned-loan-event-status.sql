CREATE TYPE sims.returned_loan_event_status AS ENUM('Pending', 'Completed', 'Edited');

COMMENT ON
TYPE sims.returned_loan_event_status IS 'Status of the returned loan event.';