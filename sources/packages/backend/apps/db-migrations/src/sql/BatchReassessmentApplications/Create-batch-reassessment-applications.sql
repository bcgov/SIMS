CREATE TYPE sims.batch_reassessment_application_result AS ENUM ('Success', 'Failure');

CREATE TABLE sims.batch_reassessment_applications (
    id SERIAL PRIMARY KEY,
    batch_reassessment_id INT NOT NULL REFERENCES sims.batch_reassessments(id),
    application_number VARCHAR(10) NOT NULL,
    student_assessment_id INT REFERENCES sims.student_assessments(id),
    result sims.batch_reassessment_application_result NOT NULL,
    failure_reason TEXT,
    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creator INT NULL DEFAULT NULL REFERENCES sims.users(id),
    modifier INT NULL DEFAULT NULL REFERENCES sims.users(id)
);

-- ## Comments
COMMENT ON TABLE sims.batch_reassessment_applications IS 'Processing result for one application included in a batch manual reassessment.';

COMMENT ON COLUMN sims.batch_reassessment_applications.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.batch_reassessment_applications.batch_reassessment_id IS 'Batch manual reassessment that included this application.';

COMMENT ON COLUMN sims.batch_reassessment_applications.application_number IS 'Application number submitted for this batch manual reassessment.';

COMMENT ON COLUMN sims.batch_reassessment_applications.student_assessment_id IS 'Assessment created for the application when processing succeeds.';

COMMENT ON COLUMN sims.batch_reassessment_applications.result IS 'Processing result for the application.';

COMMENT ON COLUMN sims.batch_reassessment_applications.failure_reason IS 'Reason the application failed batch manual reassessment processing.';

COMMENT ON COLUMN sims.batch_reassessment_applications.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.batch_reassessment_applications.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.batch_reassessment_applications.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.batch_reassessment_applications.modifier IS 'Modifier of the record.';