-- Drop tuition_remittance_requested_amount from sims.education_programs_offerings. 
ALTER TABLE
    sims.education_programs_offerings DROP COLUMN IF EXISTS tuition_remittance_requested_amount;

-- Drop tuition_remittance_requested from sims.education_programs_offerings. 
ALTER TABLE
    sims.education_programs_offerings DROP COLUMN IF EXISTS tuition_remittance_requested;    