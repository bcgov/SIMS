CREATE TABLE IF NOT EXISTS education_programs_offerings(
  id SERIAL PRIMARY KEY,
  offering_name VARCHAR(300) NOT NULL,
  study_start_date Date NULL,
  study_end_date Date NULL,
  break_start_date Date NULL,
  break_end_date Date NULL,
  actual_tuition_costs INT NULL,
  program_related_costs INT NULL,
  mandatory_fees INT NULL,
  exceptional_expenses INT NULL, 
  tuition_remittance_requested_amount INT NULL,
  offering_delivered VARCHAR(50) NULL, 
  lacks_study_dates BIT NOT NULL,
  lacks_study_breaks BIT NOT NULL,
  lacks_fixed_costs BIT NOT NULL,
  tuition_remittance_requested VARCHAR(50) NOT NULL,
  
  -- Reference Columns
  program_id INT REFERENCES education_programs(id) ON DELETE CASCADE,
  location_id INT REFERENCES institution_locations(id) ON DELETE CASCADE,
  
  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL
);

-- ## Comments
COMMENT ON TABLE education_programs_offerings IS 'The main resource table to store education programs offerings related information';
COMMENT ON COLUMN education_programs_offerings.id IS 'Auto-generated sequential primary key column';
COMMENT ON COLUMN education_programs_offerings.offering_name IS 'Offering name';
COMMENT ON COLUMN education_programs_offerings.study_start_date IS 'Offering Study start date';
COMMENT ON COLUMN education_programs_offerings.study_end_date IS 'Offering Study end date';
COMMENT ON COLUMN education_programs_offerings.break_start_date IS 'Offering Break start date';
COMMENT ON COLUMN education_programs_offerings.break_end_date IS 'Offering Break end date';
COMMENT ON COLUMN education_programs_offerings.actual_tuition_costs IS 'Offering Actual Tuition Costs';
COMMENT ON COLUMN education_programs_offerings.program_related_costs IS 'Offering Program Related Costs';
COMMENT ON COLUMN education_programs_offerings.mandatory_fees IS 'Offering Mandatory Fees';
COMMENT ON COLUMN education_programs_offerings.exceptional_expenses IS 'Offering Exceptional Expenses';
COMMENT ON COLUMN education_programs_offerings.tuition_remittance_requested_amount IS 'Offering Amount Requested';
COMMENT ON COLUMN education_programs_offerings.offering_delivered IS 'How Offering is Delivered like Onsite, Online, Blended';
COMMENT ON COLUMN education_programs_offerings.lacks_study_dates IS 'Offering does not have Program Dates?';
COMMENT ON COLUMN education_programs_offerings.lacks_study_breaks IS 'Offering does not have Study Breaks?';
COMMENT ON COLUMN education_programs_offerings.lacks_fixed_costs IS 'Offering does not have Fixed Costs?';
COMMENT ON COLUMN education_programs_offerings.tuition_remittance_requested IS 'Offering Tuition Remittance Requested like Yes, No';
COMMENT ON COLUMN education_programs_offerings.program_id IS 'Related program';
COMMENT ON COLUMN education_programs_offerings.location_id IS 'Related location';
COMMENT ON COLUMN education_programs_offerings.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN education_programs_offerings.updated_at IS 'Record update timestamp';
COMMENT ON COLUMN education_programs_offerings.creator IS 'Creator of the record. Null specified the record is created by system';
COMMENT ON COLUMN education_programs_offerings.modifier IS 'Modifier of the record. Null specified the record is modified by system';
