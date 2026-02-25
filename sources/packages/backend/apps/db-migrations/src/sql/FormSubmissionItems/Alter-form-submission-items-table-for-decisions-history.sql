-- The feature is still under development, so we can safely delete all existing data in the form submission and form submission items tables.
DELETE FROM sims.form_submission_items;
DELETE FROM sims.form_submissions;

-- This constraint is moved to the form_submission_item_decisions table.
ALTER TABLE sims.form_submission_items DROP CONSTRAINT form_submission_items_decision_fields_required_constraint;

-- Drop decision fields from form_submission_items and add reference to the most recent decision in form_submission_item_decisions.
ALTER TABLE sims.form_submission_items
    DROP COLUMN decision_status,
    DROP COLUMN decision_date,
    DROP COLUMN decision_by,
    DROP COLUMN decision_note_id,
    ADD COLUMN current_decision_id INT REFERENCES sims.form_submission_item_decisions(id);

-- Add comments for the new current_decision_id column.
COMMENT ON COLUMN sims.form_submission_items.current_decision_id IS 'Reference to the most recent decision for this form submission item. This column points to the latest record in the form_submission_item_decisions table, which maintains the history of all decisions made on this item.';


