-- Add restriction_category to restrictions table.
ALTER TABLE
    sims.restrictions
ADD
    COLUMN IF NOT EXISTS restriction_category VARCHAR(50) NOT NULL DEFAULT 'Federal';

COMMENT ON COLUMN sims.restrictions.restriction_category IS 'All the provincial restrictions have restriction category. For federal restrictions this value is set to Federal';

--Default constraint for the restriction_category is removed after the not null constraint is enforced.
ALTER TABLE
    sims.restrictions
ALTER COLUMN
    restriction_category DROP DEFAULT;