ALTER TABLE
    sims.restrictions
ADD
    COLUMN action_effective_conditions JSONB;

COMMENT ON COLUMN sims.restrictions.action_effective_conditions IS 'One or more conditions that makes the restriction actions effective if provided. If no conditions are provided then restriction actions are implicitly effective.';