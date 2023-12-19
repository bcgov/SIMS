-- Update parent offering id as primary id if parent offering id is null.
Update
  sims.education_programs_offerings
SET
  parent_offering_id = id
WHERE
  parent_offering_id IS NULL;