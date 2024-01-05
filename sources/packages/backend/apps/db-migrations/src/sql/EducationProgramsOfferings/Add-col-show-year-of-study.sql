-- Add show_year_of_study to education_programs_offerings table.
ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN offering_note;

COMMENT ON COLUMN sims.education_programs_offerings.show_year_of_study IS 'This value determines if we show year of study to students.';