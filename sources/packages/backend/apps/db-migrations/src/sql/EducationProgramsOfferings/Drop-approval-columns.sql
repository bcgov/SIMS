-- Drop assessed_by from sims.education_programs_offerings. 
ALTER TABLE
    sims.education_programs_offerings DROP COLUMN IF EXISTS assessed_by;

-- Drop assessed_date from sims.education_programs_offerings. 
ALTER TABLE
    sims.education_programs_offerings DROP COLUMN IF EXISTS assessed_date;

-- Drop submitted_date from sims.education_programs_offerings. 
ALTER TABLE
    sims.education_programs_offerings DROP COLUMN IF EXISTS submitted_date;