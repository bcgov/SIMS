CREATE TYPE sims.modified_independent_status AS ENUM ('Approved', 'Declined');

COMMENT ON TYPE sims.modified_independent_status IS 'Modified independent status of the student.';