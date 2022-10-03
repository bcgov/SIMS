-- Add relationship_status
ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS relationship_status sims.relationship_status;

COMMENT ON COLUMN sims.applications.relationship_status IS 'Relationship status given by the student in the application.';

-- Add student_number
ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS student_number VARCHAR(20) ;

COMMENT ON COLUMN sims.applications.student_number IS 'Student number given by the student in the application.';
