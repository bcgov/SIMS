ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN study_breaks_before_update JSONB;

COMMENT ON COLUMN sims.education_programs_offerings.study_breaks_before_update IS 'Column created to store the study breaks information before update for rollback.';

-- History table add column.
ALTER TABLE
    sims.education_programs_offerings_history
ADD
    COLUMN study_breaks_before_update JSONB;

COMMENT ON COLUMN sims.education_programs_offerings_history.study_breaks_before_update IS 'Historical data from the original table. See original table comments for details.';

-- Update the totalFundedWeeks to 52 if it is greater than 52 and store the previous study_breaks value in funded_weeks_before_update column for rollback.
UPDATE
    sims.education_programs_offerings
SET
    study_breaks_before_update = study_breaks,
    study_breaks = jsonb_set(
        study_breaks,
        '{totalFundedWeeks}',
        to_jsonb(52),
        false
    )
WHERE
    (study_breaks -> 'totalFundedWeeks') :: SMALLINT > 52;