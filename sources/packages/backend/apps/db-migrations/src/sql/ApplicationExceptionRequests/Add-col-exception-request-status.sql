ALTER TABLE
    sims.application_exception_requests
ADD
    COLUMN exception_request_status sims.application_exception_request_status NOT NULL DEFAULT 'Pending';

COMMENT ON COLUMN sims.application_exception_requests.exception_request_status IS 'Status of the application exception request.';

-- Update the status of existing exception requests which belong to completed exceptions(approved or declined).
-- If the exception is approved then the status of all the associated exception requests should be set to approved.
-- If the exception is declined then the status of all the associated exception requests should be set to declined.
UPDATE
    sims.application_exception_requests exception_request
SET
    -- The value for the statuses approved and declined are same between the types sims.application_exception_request_status and sims.application_exception_status
    -- and hence we can directly cast the text value from one type to another.
    exception_request_status = (exception.exception_status :: text) :: sims.application_exception_request_status,
    modifier = (
        SELECT
            id
        FROM
            sims.users
        WHERE
            -- System user.
            user_name = '8fb44f70-6ce6-11ed-b307-8743a2da47ef@system'
    ),
    updated_at = NOW()
FROM
    sims.application_exceptions exception
WHERE
    exception_request.application_exception_id = exception.id
    AND exception.exception_status IN ('Approved', 'Declined');

-- Update the status of previously approved exception requests to Approved.
UPDATE
    sims.application_exception_requests
SET
    exception_request_status = 'Approved',
    modifier = (
        SELECT
            id
        FROM
            sims.users
        WHERE
            -- System user.
            user_name = '8fb44f70-6ce6-11ed-b307-8743a2da47ef@system'
    ),
    updated_at = NOW()
WHERE
    approval_exception_request_id IS NOT NULL;

-- Drop default value after updating existing records.
ALTER TABLE
    sims.application_exception_requests
ALTER COLUMN
    exception_request_status DROP DEFAULT;