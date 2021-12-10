-- Create relationship_status
ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS relationship_status VARCHAR(20) NOT NULL DEFAULT 'single';

COMMENT ON COLUMN sims.applications.relationship_status IS 'Relationship status given by the student in the application.';

-- Default constraint for the relationship_status is removed after the not null constraint is enforced
ALTER TABLE
    sims.applications
ALTER
    COLUMN relationship_status DROP DEFAULT;    