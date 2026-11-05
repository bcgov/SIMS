-- Create restriction for student compliance verification.
-- Stopping disbursements also prevents the student from accepting the assessment.
INSERT INTO
    sims.restrictions (
        restriction_type,
        restriction_code,
        description,
        restriction_category,
        action_type,
        notification_type
    )
VALUES
    (
        'Provincial' :: sims.restriction_types,
        'SCV',
        'Funding blocked for student compliance verification.',
        'Verification',
        ARRAY [
            'Stop full-time disbursement',
            'Stop part-time disbursement'
        ] :: sims.restriction_action_types [],
        'Error' :: sims.restriction_notification_types
    );
