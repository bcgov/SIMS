CREATE TYPE sims.modified_independent_status AS ENUM ('Approved', 'Declined');

COMMENT ON TYPE sims.modified_independent_status IS 'Status of the modified independent associated to the student.';