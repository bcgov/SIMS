ALTER TABLE
    sims.education_programs_offerings
ALTER COLUMN
    actual_tuition_costs TYPE NUMERIC(8, 2);

ALTER TABLE
    sims.education_programs_offerings
ALTER COLUMN
    program_related_costs TYPE NUMERIC(8, 2);

ALTER TABLE
    sims.education_programs_offerings
ALTER COLUMN
    mandatory_fees TYPE NUMERIC(8, 2);

ALTER TABLE
    sims.education_programs_offerings
ALTER COLUMN
    exceptional_expenses TYPE NUMERIC(8, 2);