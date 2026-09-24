CREATE TYPE sims.batch_reassessment_status AS ENUM ('Completed', 'In progress');

CREATE TABLE sims.batch_reassessments (
    id SERIAL PRIMARY KEY,
    batch_number INTEGER NOT NULL,
    STATUS sims.batch_reassessment_status NOT NULL,
    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creator INT NULL DEFAULT NULL REFERENCES sims.users(id),
    modifier INT NULL DEFAULT NULL REFERENCES sims.users(id)
);

-- ## Comments
COMMENT ON TABLE sims.batch_reassessments IS 'Batch manual reassessment submitted by a ministry user.';

COMMENT ON COLUMN sims.batch_reassessments.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.batch_reassessments.batch_number IS 'Sequential batch number displayed to users.';

COMMENT ON COLUMN sims.batch_reassessments.status IS 'Final processing status of the batch manual reassessment.';

COMMENT ON COLUMN sims.batch_reassessments.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.batch_reassessments.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.batch_reassessments.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.batch_reassessments.modifier IS 'Modifier of the record.';