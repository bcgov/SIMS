--Alter the column program status to use Enum from varchar.
ALTER TABLE
    sims.education_programs
ALTER COLUMN
    program_status TYPE sims.program_status USING CASE
        WHEN program_status = 'approved' then 'Approved'
        WHEN program_status = 'declined' then 'Declined'
        WHEN program_status = 'pending' then 'Pending'
        ELSE 'Pending' :: sims.program_status
    END;