-- Create the unique index for the offering name, start, and end dates on the same program and location.
DROP INDEX sims.location_id_program_id_offering_name_study_dates_index;

-- The unique index is valid only for the offerings in "Approved" or "Creation pending",
-- the others statuses can allow the duplication, for instance, during an "offering request a changed" process the offering can be "cloned".
-- A unique index was used instead of a constraint to allow the creation of the unique "constraint" including the 
-- where IN ('Approved', 'Creation pending').
CREATE UNIQUE INDEX location_id_program_id_offering_name_study_dates_offering_type_year_of_study_index ON sims.education_programs_offerings(
  location_id,
  program_id,
  offering_name,
  study_start_date,
  study_end_date,
  offering_status,
  offering_type,
  year_of_study
)
WHERE
  (
    offering_status IN ('Approved', 'Creation pending')
  );

COMMENT ON INDEX sims.location_id_program_id_offering_name_study_dates_offering_type_year_of_study_index IS 'Ensures offering in "Approved" or "Creation pending" statuses does not have the same name, study start/end dates, offering type and year of study.'