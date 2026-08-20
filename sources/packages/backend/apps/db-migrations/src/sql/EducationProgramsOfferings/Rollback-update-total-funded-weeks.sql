-- Update the study_breaks JSONB column to restore the original totalFundedWeeks value before the previous update.
-- Update is only applied to rows where the study_breaks_before_update column is not null
-- indicating that the total funded weeks were updated only on these rows where the study_breaks_before_update was populated with the original value before the update.
UPDATE
    sims.education_programs_offerings
SET
    study_breaks = jsonb_set(
        study_breaks,
        '{totalFundedWeeks}',
        to_jsonb(
            (study_breaks_before_update -> 'totalFundedWeeks') :: SMALLINT
        ),
        false
    )
WHERE
    study_breaks_before_update IS NOT NULL;

ALTER TABLE
    sims.education_programs_offerings DROP COLUMN study_breaks_before_update;

ALTER TABLE
    sims.education_programs_offerings_history DROP COLUMN study_breaks_before_update;