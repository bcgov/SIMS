CREATE TABLE sims.form_submission_items(
    id SERIAL PRIMARY KEY,
    form_submission_id INT REFERENCES sims.form_submissions(id) NOT NULL,
    dynamic_form_configuration_id INT REFERENCES sims.dynamic_form_configurations(id) NOT NULL,
    submitted_data jsonb NOT NULL,
    decision_status sims.form_submission_decision_status NOT NULL,
    decision_date TIMESTAMP WITH TIME ZONE,
    decision_by INT REFERENCES sims.users (id),
    decision_note_id INT REFERENCES sims.notes (id),
    -- Audit columns.
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creator INT NOT NULL REFERENCES sims.users(id),
    modifier INT NULL DEFAULT NULL REFERENCES sims.users(id),
    -- Ensure decision fields are all provided when decision status is not pending.
    CONSTRAINT form_submission_items_decision_fields_required_constraint CHECK (
        (
            decision_status != 'Pending' :: sims.form_submission_decision_status
            AND decision_date IS NOT NULL
            AND decision_by IS NOT NULL
            AND decision_note_id IS NOT NULL
        )
        OR (
            decision_status = 'Pending' :: sims.form_submission_decision_status
        )
    )
);

-- Table and column comments for sims.form_submission_items.
COMMENT ON TABLE sims.form_submission_items IS 'Individual forms submitted for a decision that are part of a form submission process. A submission can contain one or more form submission items, each representing a specific form filled out by the user.';

COMMENT ON COLUMN sims.form_submission_items.id IS 'Primary key of the form submission item.';

COMMENT ON COLUMN sims.form_submission_items.form_submission_id IS 'Parent form submission that this item belongs to.';

COMMENT ON COLUMN sims.form_submission_items.dynamic_form_configuration_id IS 'Dynamic form configuration used to render and validate this item.';

COMMENT ON COLUMN sims.form_submission_items.submitted_data IS 'Submitted form data payload in JSON format.';

COMMENT ON COLUMN sims.form_submission_items.decision_status IS 'Current decision status for this item.';

COMMENT ON COLUMN sims.form_submission_items.decision_date IS 'Date and time when the decision was recorded.';

COMMENT ON COLUMN sims.form_submission_items.decision_by IS 'Ministry user who made the decision.';

COMMENT ON COLUMN sims.form_submission_items.decision_note_id IS 'Note associated with the decision.';

COMMENT ON COLUMN sims.form_submission_items.created_at IS 'Timestamp when the record was created.';

COMMENT ON COLUMN sims.form_submission_items.updated_at IS 'Timestamp when the record was last updated.';

COMMENT ON COLUMN sims.form_submission_items.creator IS 'User ID of the record creator.';

COMMENT ON COLUMN sims.form_submission_items.modifier IS 'User ID of the last user who modified the record.';

-- Constraints comments.
COMMENT ON CONSTRAINT form_submission_items_decision_fields_required_constraint ON sims.form_submission_items IS 'Requires decision_date, decision_by, and decision_note_id when decision_status is not pending.';