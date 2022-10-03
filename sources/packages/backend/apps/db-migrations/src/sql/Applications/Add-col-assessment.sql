ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "assessment" jsonb;

COMMENT ON COLUMN applications.assessment IS 'Assessment information after it is calculated from camunda workflow in the student application.';