-- Drop tuition_remittance_effective_amount from sims.disbursement_schedules. 
ALTER TABLE
    sims.disbursement_schedules DROP COLUMN IF EXISTS tuition_remittance_effective_amount;