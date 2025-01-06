UPDATE sims.sequence_controls
SET sequence_name = 'DISBURSEMENT_DOCUMENT_NUMBER'::varchar(100)
WHERE sequence_name = 'Part Time_DISBURSEMENT_DOCUMENT_NUMBER'::varchar(100);
