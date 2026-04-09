-- Create a temporary column to store the reference to the original student appeal request record.
-- This will allow us to maintain the relationship between the original appeal request and the new
-- form submission item decision record for easier tracking and potential rollback if needed.
ALTER TABLE
    sims.form_submission_item_decisions
ADD
    COLUMN converted_student_appeal_request_id INT REFERENCES sims.student_appeal_requests(id);

-- Create the new form submission item decision records based on the existing student appeal requests that are not in 'Pending' status.
-- Only one decision may be ever associated with a given student appeal request.
INSERT INTO
    sims.form_submission_item_decisions (
        converted_student_appeal_request_id,
        form_submission_item_id,
        decision_status,
        decision_date,
        decision_by,
        decision_note_id,
        created_at,
        updated_at,
        creator,
        modifier
    )
SELECT
    student_appeal_requests.id AS converted_student_appeal_request_id,
    form_submission_items.id AS form_submission_item_id,
    student_appeal_requests.appeal_status :: TEXT :: sims.form_submission_decision_status AS decision_status,
    student_appeal_requests.assessed_date AS decision_date,
    student_appeal_requests.assessed_by AS decision_by,
    student_appeal_requests.note_id AS decision_note_id,
    student_appeal_requests.created_at AS created_at,
    student_appeal_requests.updated_at AS updated_at,
    student_appeal_requests.creator AS creator,
    student_appeal_requests.modifier AS modifier
FROM
    sims.student_appeal_requests student_appeal_requests
    JOIN sims.form_submission_items ON form_submission_items.converted_student_appeal_request_id = student_appeal_requests.id
WHERE
    student_appeal_requests.appeal_status <> 'Pending';

-- Update the current decision back to the form_submission_items.current_decision_id.
UPDATE
    sims.form_submission_items
SET
    current_decision_id = form_submission_item_decisions.id
FROM
    sims.form_submission_item_decisions
WHERE
    form_submission_item_decisions.converted_student_appeal_request_id = sims.form_submission_items.converted_student_appeal_request_id