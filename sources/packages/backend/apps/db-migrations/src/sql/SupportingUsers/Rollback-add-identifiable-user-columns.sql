ALTER TABLE
    sims.supporting_users DROP COLUMN is_able_to_report,
    DROP COLUMN full_name;

ALTER TABLE
    sims.supporting_users_history DROP COLUMN is_able_to_report,
    DROP COLUMN full_name;