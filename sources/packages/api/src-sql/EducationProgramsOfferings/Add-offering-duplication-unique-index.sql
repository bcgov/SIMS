-- Remove duplicated offerings that would prevent the unique index from being created.
DELETE FROM
  sims.education_programs_offerings
WHERE
  id IN (
    SELECT
      offerings.id
    FROM
      sims.education_programs_offerings offerings
      INNER JOIN (
        SELECT
          location_id,
          program_id,
          offering_name,
          study_start_date,
          study_end_date
        FROM
          sims.education_programs_offerings
        WHERE
          offering_status IN ('Approved', 'Creation pending')
        GROUP BY
          location_id,
          program_id,
          offering_name,
          study_start_date,
          study_end_date
        HAVING
          count(*) > 1
      ) AS duplicated_offerings ON offerings.location_id = duplicated_offerings.location_id
      AND offerings.program_id = duplicated_offerings.program_id
      AND offerings.offering_name = duplicated_offerings.offering_name
      AND offerings.study_start_date = duplicated_offerings.study_start_date
      AND offerings.study_end_date = duplicated_offerings.study_end_date
      AND offerings.offering_status IN ('Approved', 'Creation pending')
  );

-- Create the unique index for the offering name, start, and end dates on the same program and location.
-- The unique index is valid only for the offerings in "Approved" or "Creationg pending",
-- the others statuses can allow the duplication, for instance, during an "offering request a changed" process the offering can be "cloned".
-- An unique index was used instead of a constraint to allow the creation of the unique "constraint" including the 
-- where IN ('Approved', 'Creation pending').
CREATE UNIQUE INDEX location_id_program_id_offering_name_study_dates_index ON sims.education_programs_offerings(
  location_id,
  program_id,
  offering_name,
  study_start_date,
  study_end_date,
  offering_status
)
WHERE
  (
    offering_status IN ('Approved', 'Creation pending')
  );

COMMENT ON INDEX sims.location_id_program_id_offering_name_study_dates_index IS 'Ensures offering in "Approved" or "Creation pending" statuses does not have the same name, study start, and study end dates.'