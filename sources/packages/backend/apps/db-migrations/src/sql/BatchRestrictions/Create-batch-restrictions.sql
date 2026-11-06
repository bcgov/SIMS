CREATE TABLE sims.batch_restrictions (
    id SERIAL PRIMARY KEY,
    batch_number INT UNIQUE NOT NULL,
    restriction_id INT NOT NULL REFERENCES sims.restrictions(id),
    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creator INT NOT NULL DEFAULT NULL REFERENCES sims.users(id),
    modifier INT NULL DEFAULT NULL REFERENCES sims.users(id)
);

-- ## Comments
COMMENT ON TABLE sims.batch_restrictions IS 'Batch restrictions submitted by a ministry user.';

COMMENT ON COLUMN sims.batch_restrictions.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.batch_restrictions.batch_number IS 'Sequential batch number displayed to users.';

COMMENT ON COLUMN sims.batch_restrictions.restriction_id IS 'Restriction added to all the students in the batch.';

COMMENT ON COLUMN sims.batch_restrictions.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.batch_restrictions.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.batch_restrictions.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.batch_restrictions.modifier IS 'Modifier of the record.';
