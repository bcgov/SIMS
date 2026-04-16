-- Create a temporary column to store the reference to the original student appeal request record.
-- This will allow us to maintain the relationship between the original appeal request and the new
-- form submission item record for easier tracking and potential rollback if needed.
ALTER TABLE
    sims.form_submission_items
ADD
    COLUMN converted_student_appeal_request_id INT REFERENCES sims.student_appeal_requests(id);

-- Convert existing student appeal requests to form submission items.
INSERT INTO
    sims.form_submission_items (
        converted_student_appeal_request_id,
        form_submission_id,
        dynamic_form_configuration_id,
        submitted_data,
        created_at,
        updated_at,
        creator,
        modifier
    )
SELECT
    student_appeal_requests.id AS converted_student_appeal_request_id,
    form_submissions.id AS form_submission_id,
    dynamic_form_configurations.id AS dynamic_form_configuration_id,
    student_appeal_requests.submitted_data AS submitted_data,
    student_appeal_requests.created_at AS created_at,
    student_appeal_requests.updated_at AS updated_at,
    student_appeal_requests.creator AS creator,
    student_appeal_requests.modifier AS modifier
FROM
    sims.student_appeal_requests student_appeal_requests
    JOIN sims.form_submissions form_submissions ON form_submissions.converted_student_appeal_id = student_appeal_requests.student_appeal_id
    JOIN sims.dynamic_form_configurations dynamic_form_configurations ON lower(dynamic_form_configurations.form_definition_name) = lower(student_appeal_requests.submitted_form_name)