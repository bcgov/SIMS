CREATE TYPE sims.student_assessment_status AS ENUM (
    'Submitted',
    'Queued',
    'In progress',
    'Completed',
    'Cancellation requested',
    'Cancellation queued',
    'Cancelled'
);