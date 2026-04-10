-- Create a temporary column to store the reference to the original student appeal record.
-- This will allow us to maintain the relationship between the original appeal and the new
-- form submission record for easier tracking and potential rollback if needed.
ALTER TABLE
    sims.form_submissions
ADD
    COLUMN converted_student_appeal_id INT REFERENCES sims.student_appeals(id);

-- Convert existing student appeals to form submissions.
INSERT INTO
    sims.form_submissions (
        converted_student_appeal_id,
        student_id,
        application_id,
        submitted_date,
        form_category,
        submission_status,
        assessed_date,
        assessed_by,
        created_at,
        updated_at,
        creator,
        modifier
    )
SELECT
    student_appeals.id AS converted_student_appeal_id,
    student_appeals.student_id,
    student_appeals.application_id,
    student_appeals.submitted_date,
    'Student appeal' AS form_category,
    (
        CASE
            WHEN (
                SELECT
                    TRUE
                FROM
                    sims.student_appeal_requests student_appeal_requests
                WHERE
                    student_appeal_requests.student_appeal_id = student_appeals.id
                    AND student_appeal_requests.appeal_status = 'Pending'
                LIMIT
                    1
            ) THEN 'Pending'
            WHEN (
                SELECT
                    TRUE
                FROM
                    sims.student_appeal_requests student_appeal_requests
                WHERE
                    student_appeal_requests.student_appeal_id = student_appeals.id
                    AND student_appeal_requests.appeal_status = 'Approved'
                ORDER BY
                    student_appeal_requests.id
                LIMIT
                    1
            ) THEN 'Completed'
            ELSE 'Declined'
        END
    ) :: sims.form_submission_status AS submission_status,
    (
        SELECT
            assessed_date
        FROM
            sims.student_appeal_requests student_appeal_requests
        WHERE
            student_appeal_requests.student_appeal_id = student_appeals.id
        ORDER BY
            student_appeal_requests.id
        LIMIT
            1
    ) AS assessed_date,
    (
        SELECT
            assessed_by
        FROM
            sims.student_appeal_requests student_appeal_requests
        WHERE
            student_appeal_requests.student_appeal_id = student_appeals.id
        ORDER BY
            student_appeal_requests.id
        LIMIT
            1
    ) AS assessed_by,
    student_appeals.created_at,
    student_appeals.updated_at,
    student_appeals.creator,
    student_appeals.modifier
FROM
    sims.student_appeals student_appeals
WHERE
    EXISTS (
        SELECT
            1
        FROM
            sims.student_appeal_requests student_appeal_requests
        WHERE
            student_appeal_requests.student_appeal_id = student_appeals.id
            AND lower(student_appeal_requests.submitted_form_name) IN (
                'stepparentwaiverappeal',
                'modifiedindependentappeal',
                'roomandboardcostsappeal'
            )
    )