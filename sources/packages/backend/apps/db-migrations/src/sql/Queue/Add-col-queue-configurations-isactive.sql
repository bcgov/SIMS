ALTER TABLE
  "queue_configurations"
ADD
  COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN queue_configurations.is_active IS 'This field decides whether the queue is active or not, only active queues are shown in the bull dashboard.';