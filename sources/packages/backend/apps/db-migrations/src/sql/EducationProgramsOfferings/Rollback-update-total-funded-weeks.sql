-- Update the study_breaks JSONB column to restore the original totalFundedWeeks value before the previous update.
-- Update is only applied to rows where the study_breaks_before_update column is not null
-- indicating that the total funded weeks were updated only on these rows where the study_breaks_before_update was populated with the original value before the update.
UPDATE
    sims.education_programs_offerings
SET
    study_breaks = jsonb_set(
        study_breaks,
        '{totalFundedWeeks}',
        (study_breaks_before_update -> 'totalFundedWeeks'),
        false
    )
WHERE
    study_breaks_before_update IS NOT NULL
    AND (study_breaks_before_update ->> 'totalDays') = (study_breaks ->> 'totalDays')
    AND (
        study_breaks_before_update ->> 'fundedStudyPeriodDays'
    ) = (study_breaks ->> 'fundedStudyPeriodDays')
    AND (
        study_breaks_before_update ->> 'unfundedStudyPeriodDays'
    ) = (study_breaks ->> 'unfundedStudyPeriodDays');

ALTER TABLE
    sims.education_programs_offerings DROP COLUMN study_breaks_before_update;

ALTER TABLE
    sims.education_programs_offerings_history DROP COLUMN study_breaks_before_update;