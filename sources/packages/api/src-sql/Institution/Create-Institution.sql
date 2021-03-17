CREATE TABLE IF NOT EXISTS institutions(
  id SERIAL PRIMARY KEY, 
  legal_operating_name VARCHAR(64) NOT NULL, 
  operating_name VARCHAR(64) NULL,  
  primary_phone VARCHAR(64) NOT NULL,  
  primary_email VARCHAR(64) NOT NULL,  
  institution_type VARCHAR(64) NOT NULL,  
  website VARCHAR(64) NOT NULL,  
  regulating_body VARCHAR(64) NOT NULL,  
  established_date  Date NOT NULL, 
  primary_contact JSONB NOT NULL,
  legal_authority_contact JSONB NOT NULL,  
  institution_address JSONB NOT NULL,  
  institution_mailing_address JSONB,
  -- Reference Columns
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  
  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL
);

-- ## Comments
COMMENT ON TABLE institutions IS 'The main resource table to store student related information. This table consists of mandatory contact information and social insurance number of student';
COMMENT ON COLUMN institutions.id IS 'Auto-generated sequential primary key column';
COMMENT ON COLUMN institutions.legal_operating_name IS 'Legal Name of the institution'; 
COMMENT ON COLUMN institutions.operating_name IS 'Optional Operating Name of the insitution';  
COMMENT ON COLUMN institutions.primary_phone IS 'Primary Phone of the Institution';  
COMMENT ON COLUMN institutions.primary_email IS 'Primary Email of the Institution';  
COMMENT ON COLUMN institutions.institution_type IS 'Institution Type - BC Private or ...';  
COMMENT ON COLUMN institutions.website IS 'Official Website Address';  
COMMENT ON COLUMN institutions.regulating_body IS 'Regulating Body';  
COMMENT ON COLUMN institutions.established_date IS 'Date when this institute was established'; 
COMMENT ON COLUMN institutions.primary_contact IS 'A JSONB structure to store Primary Contact Information';
COMMENT ON COLUMN institutions.legal_authority_contact IS 'A JSONB structure to store Legal Authorities Contact Information';  
COMMENT ON COLUMN institutions.institution_address IS 'Primary Address for the Institution';  
COMMENT ON COLUMN institutions.institution_mailing_address IS 'Mailing Address for the Institution';

COMMENT ON COLUMN institutions.user_id IS 'Foreign key reference to users table which includes users related information of student';
COMMENT ON COLUMN institutions.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN institutions.updated_at IS 'Record update timestamp';
COMMENT ON COLUMN institutions.creator IS 'Creator of the record. Null specified the record is created by system';
COMMENT ON COLUMN institutions.modifier IS 'Modifier of the record. Null specified the record is modified by system';
