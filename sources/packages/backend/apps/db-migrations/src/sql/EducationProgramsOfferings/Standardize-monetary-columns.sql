ALTER TABLE
    sims.education_programs_offerings
alter COLUMN
    actual_tuition_costs type NUMERIC(8, 2);

ALTER TABLE
    sims.education_programs_offerings
alter COLUMN
    program_related_costs type NUMERIC(8, 2);

ALTER TABLE
    sims.education_programs_offerings
alter COLUMN
    mandatory_fees type NUMERIC(8, 2);

ALTER TABLE
    sims.education_programs_offerings
alter COLUMN
    exceptional_expenses type NUMERIC(8, 2);