CREATE TABLE sims.form_submission_item_decisions(
    id SERIAL PRIMARY KEY,
    form_submission_item_id INT REFERENCES sims.form_submission_items(id) NOT NULL,
    decision_status sims.form_submission_decision_status NOT NULL,
    decision_date TIMESTAMP WITH TIME ZONE,
    decision_by INT REFERENCES sims.users (id),
    decision_note_id INT REFERENCES sims.notes (id),
    -- Audit columns.
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creator INT NOT NULL REFERENCES sims.users(id),
    modifier INT DEFAULT NULL REFERENCES sims.users(id),
    -- Ensure decision fields are all provided when decision status is not pending.
    CONSTRAINT form_submission_item_decisions_fields_required_constraint CHECK (
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

-- Table and column comments for sims.form_submission_item_decisions.
COMMENT ON TABLE sims.form_submission_item_decisions IS 'History of forms decisions taken by the Ministry. The decisions history is stored in a separate table to preserve the history of decisions for each form submission item. Each time a decision is made (or reverted) on a form submission item, a new record is inserted into this table with the relevant decision details.';

COMMENT ON COLUMN sims.form_submission_item_decisions.id IS 'Primary key of the form submission item decision.';

COMMENT ON COLUMN sims.form_submission_item_decisions.form_submission_item_id IS 'Parent form submission item that this decision belongs to.';

COMMENT ON COLUMN sims.form_submission_item_decisions.decision_status IS 'Current decision status for this item.';

COMMENT ON COLUMN sims.form_submission_item_decisions.decision_date IS 'Date and time when the decision was recorded.';

COMMENT ON COLUMN sims.form_submission_item_decisions.decision_by IS 'Ministry user who made the decision.';

COMMENT ON COLUMN sims.form_submission_item_decisions.decision_note_id IS 'Note associated with the decision.';

COMMENT ON COLUMN sims.form_submission_item_decisions.created_at IS 'Timestamp when the record was created.';

COMMENT ON COLUMN sims.form_submission_item_decisions.updated_at IS 'Timestamp when the record was last updated.';

COMMENT ON COLUMN sims.form_submission_item_decisions.creator IS 'User ID of the record creator.';

COMMENT ON COLUMN sims.form_submission_item_decisions.modifier IS 'User ID of the last user who modified the record.';

-- Constraints comments.
COMMENT ON CONSTRAINT form_submission_item_decisions_fields_required_constraint ON sims.form_submission_item_decisions IS 'Requires decision_date, decision_by, and decision_note_id when decision_status is not pending.';