-- Revert parent offering id to null, where parent offering id is primary id.
Update
  sims.education_programs_offerings
SET
  parent_offering_id = NULL
WHERE
  parent_offering_id = id;