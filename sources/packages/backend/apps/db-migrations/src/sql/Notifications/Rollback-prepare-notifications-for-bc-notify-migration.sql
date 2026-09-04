ALTER TABLE
    sims.notifications DROP COLUMN message_content,
    DROP COLUMN IF EXISTS recipients,
    DROP COLUMN IF EXISTS template_id;