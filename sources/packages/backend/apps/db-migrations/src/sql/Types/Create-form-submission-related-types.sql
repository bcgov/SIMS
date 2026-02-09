CREATE TYPE sims.form_category_types AS ENUM(
    'Student appeal',
    'Student form',
    'System'
);

COMMENT ON TYPE sims.form_category_types IS 'Defines the category of forms.';

CREATE TYPE sims.form_submission_status AS ENUM('Pending', 'Completed', 'Declined');

COMMENT ON TYPE sims.form_submission_status IS 'This status applies to a submission containing one-to-many forms that require assessment and decision. Once all forms within the submission have been assessed, the submission is marked as Completed or Declined. ''Declined'' indicates that all forms were rejected, whereas ''Completed'' indicates that at least one form was approved. This value is denormalized for easier querying of submission status without needing to evaluate the status of each individual form submission item.';

CREATE TYPE sims.form_submission_decision_status AS ENUM(
    'Pending',
    'Approved',
    'Declined'
);

COMMENT ON TYPE sims.form_submission_decision_status IS 'Status of a form submission item (individual decision), indicating whether it is pending, approved, or declined. Each item within a form submission will be assessed individually, and this status reflects the decision for that specific item. A declined item may be part of a completed submission when some other items were approved.';