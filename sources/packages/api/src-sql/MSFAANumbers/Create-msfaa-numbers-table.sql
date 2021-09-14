CREATE TABLE IF NOT EXISTS sims.msfaa_numbers (
  id SERIAL PRIMARY KEY,
  msfaa_number BIGINT NOT NULL,
  date_requested TIMESTAMP WITH TIME ZONE,
  date_signed DATE,
  service_provider_received_date DATE,
  -- Reference Columns
  student_id INT NOT NULL REFERENCES sims.students(id) ON DELETE CASCADE,
  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
  SET
    NULL,
    modifier INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
  SET
    NULL
);

-- ## Comments
COMMENT ON TABLE sims.msfaa_numbers IS 'Keep track of the MSFAA (Master Student Financial Aid Agreement) numbers generated for a student.';

COMMENT ON COLUMN sims.msfaa_numbers.id IS 'Auto-generated sequential primary key column';

COMMENT ON COLUMN sims.msfaa_numbers.msfaa_number IS 'Unique generated number to be sent to ESDC to identify the MSFAA.';

COMMENT ON COLUMN sims.msfaa_numbers.date_requested IS 'Date that the request was generated to ESDC. When null, it indicates that the request was not sent yet.';

COMMENT ON COLUMN sims.msfaa_numbers.date_signed IS 'Date that the student signed the MSFAA. If null, the response was not returned from ESDC yet or the student did not signed the agreement.';

COMMENT ON COLUMN sims.msfaa_numbers.service_provider_received_date IS 'Date that the service provider received the signed student MSFAA.';

COMMENT ON COLUMN sims.msfaa_numbers.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN sims.msfaa_numbers.updated_at IS 'Record update timestamp';

COMMENT ON COLUMN sims.msfaa_numbers.creator IS 'Creator of the record. Null specified the record is created by system';

COMMENT ON COLUMN sims.msfaa_numbers.modifier IS 'Modifier of the record. Null specified the record is modified by system';