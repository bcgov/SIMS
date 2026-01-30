CREATE TYPE sims.form_category_types AS ENUM(
    'Student appeal',
    'Student form',
    'System'
);

COMMENT ON TYPE sims.form_category_types IS 'Defines the category of forms.';

-- CREATE TYPE sims.form_submission_grouping_types AS ENUM(
--     'Application bundle',
--     'Student standalone'
-- );
-- COMMENT ON TYPE sims.form_submission_grouping_types IS 'Defines how forms can be grouped when submitted. An application bundle groups multiple forms together as part of a single application process. A student standalone refers to forms that are submitted independently and are associated directly with a student, rather than an application.';
CREATE TYPE sims.form_submission_status AS ENUM('Pending', 'Completed');

COMMENT ON TYPE sims.form_submission_status IS 'Status for form submission that contains one to many forms to be assessed and have a decision assigned. Once all forms within the submission have been assessed, the status is marked as Completed.';

CREATE TYPE sims.form_submission_decision_status AS ENUM(
    'Pending',
    'Approved',
    'Declined'
);

COMMENT ON TYPE sims.form_submission_decision_status IS 'Status of a form submission item (individual decision), indicating whether it is pending, approved, or declined. Each item within a form submission will be assessed individually, and this status reflects the decision for that specific item. A declined item may be part of an approved submission when some other items were approved.';