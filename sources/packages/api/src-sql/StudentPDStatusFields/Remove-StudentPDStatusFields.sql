-- Remove column pd_date_sent for PD
ALTER TABLE students DROP 
  COLUMN IF EXISTS pd_date_sent;
  
-- Remove column pd_date_update for PD
ALTER TABLE students DROP 
  COLUMN IF EXISTS pd_date_update;
  
-- Remove column pd_status for PD 
ALTER TABLE students DROP 
  COLUMN IF EXISTS pd_status;
