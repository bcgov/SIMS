CREATE TYPE sims.form_submission_grouping_types AS ENUM(
    'Application bundle',
    'Application standalone',
    'Student standalone'
);
COMMENT ON TYPE sims.form_submission_grouping_types IS 'Defines how forms can be grouped when submitted. An application bundle groups multiple forms together as part of a single application process. An application standalone refers to individual forms that are submitted independently of an application. A student standalone refers to forms that are submitted independently and are associated directly with a student, rather than an application.';

CREATE TYPE sims.form_submission_status AS ENUM(
    'Pending',
    'Approved',
    'Declined'
);
COMMENT ON TYPE sims.form_submission_status IS 'Status of a form submission, indicating whether it is pending, approved, or declined. A form submission may have one to many items that are assessed individually, but the overall submission status provides the final decision status.';

CREATE TYPE sims.form_submission_item_status AS ENUM(
    'Pending',
    'Approved',
    'Declined'
);
COMMENT ON TYPE sims.form_submission_item_status IS 'Status of a form submission item, indicating whether it is pending, approved, or declined. Each item within a form submission may be assessed individually, and this status reflects the decision for that specific item. A declined item may be part of an approved submission when some other items were approved.';

