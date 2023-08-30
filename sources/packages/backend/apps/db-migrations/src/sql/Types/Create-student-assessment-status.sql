CREATE TYPE sims.student_assessment_status AS ENUM (
    'Created',
    'Queued',
    'In progress',
    'Completed',
    'Cancellation requested',
    'Cancellation queued',
    'Cancelled'
);