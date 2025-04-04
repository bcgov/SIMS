ALTER TABLE
    sims.education_programs_offerings DROP COLUMN online_instruction_mode,
    DROP COLUMN is_online_duration_same_always,
    DROP COLUMN total_online_duration,
    DROP COLUMN minimum_online_duration,
    DROP COLUMN maximum_online_duration;

-- Drop new columns from the history table.
ALTER TABLE
    sims.education_programs_offerings_history DROP COLUMN online_instruction_mode,
    DROP COLUMN is_online_duration_same_always,
    DROP COLUMN total_online_duration,
    DROP COLUMN minimum_online_duration,
    DROP COLUMN maximum_online_duration;