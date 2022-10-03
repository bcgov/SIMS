-- Remove column pd_date_sent for PD
ALTER TABLE students DROP 
  COLUMN IF EXISTS pd_date_sent;
  
-- Remove column pd_date_update for PD
ALTER TABLE students DROP 
  COLUMN IF EXISTS pd_date_update;

