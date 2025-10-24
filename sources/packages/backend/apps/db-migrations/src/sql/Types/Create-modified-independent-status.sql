CREATE TYPE sims.modified_independent_status AS ENUM ('Not requested', 'Approved', 'Declined');

COMMENT ON TYPE sims.modified_independent_status IS 'Modified independent status of the student.';