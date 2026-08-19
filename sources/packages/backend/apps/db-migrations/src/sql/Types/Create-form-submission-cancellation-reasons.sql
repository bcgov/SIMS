CREATE TYPE sims.form_submission_cancellation_reasons AS ENUM(
    'Application edited',
    'Application cancelled',
    'Student cancelled submission'
);

COMMENT ON TYPE sims.form_submission_cancellation_reasons IS 'Form submission cancellation reasons.';