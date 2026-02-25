-- The feature is still under development, so we can safely delete all existing data in the form submission decisions, form submission items, and form submission tables.
DELETE FROM sims.form_submission_item_decisions;
DELETE FROM sims.form_submission_items;
DELETE FROM sims.form_submissions;

-- Drop reference to the current decision from form_submission_items and restore decision fields.
ALTER TABLE sims.form_submission_items
    DROP COLUMN current_decision_id,
    ADD COLUMN decision_status sims.form_submission_decision_status NOT NULL,
    ADD COLUMN decision_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN decision_by INT REFERENCES sims.users(id),
    ADD COLUMN decision_note_id INT REFERENCES sims.notes(id);

-- Restore decision validation constraint in form_submission_items.
ALTER TABLE sims.form_submission_items
    ADD CONSTRAINT form_submission_items_decision_fields_required_constraint CHECK (
        (
            decision_status != 'Pending' :: sims.form_submission_decision_status
            AND decision_date IS NOT NULL
            AND decision_by IS NOT NULL
            AND decision_note_id IS NOT NULL
        )
        OR (
            decision_status = 'Pending' :: sims.form_submission_decision_status
        )
    );

-- Restore comments for form_submission_items decision columns and constraints.
COMMENT ON COLUMN sims.form_submission_items.decision_status IS 'Current decision status for this item.';

COMMENT ON COLUMN sims.form_submission_items.decision_date IS 'Date and time when the decision was recorded.';

COMMENT ON COLUMN sims.form_submission_items.decision_by IS 'Ministry user who made the decision.';

COMMENT ON COLUMN sims.form_submission_items.decision_note_id IS 'Note associated with the decision.';

COMMENT ON CONSTRAINT form_submission_items_decision_fields_required_constraint ON sims.form_submission_items IS 'Requires decision_date, decision_by, and decision_note_id when decision_status is not pending.';
