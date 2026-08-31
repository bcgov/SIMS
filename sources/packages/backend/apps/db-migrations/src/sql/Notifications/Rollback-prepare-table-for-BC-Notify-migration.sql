ALTER TABLE
    sims.notifications DROP COLUMN message,
    DROP COLUMN IF EXISTS recipients,
    DROP COLUMN IF EXISTS template_id;