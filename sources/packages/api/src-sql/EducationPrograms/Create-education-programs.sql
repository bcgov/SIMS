CREATE TABLE IF NOT EXISTS education_programs(
  id SERIAL PRIMARY KEY,
  program_name VARCHAR(300) NOT NULL,
  program_description VARCHAR(500) NOT NULL,
  credential_type VARCHAR(50) NOT NULL,
  credential_type_other VARCHAR(300) NULL,
  cip_code VARCHAR(50) NOT NULL,
  noc_code VARCHAR(50) NULL,
  sabc_code VARCHAR(50) NULL,
  regulatory_body VARCHAR(100) NOT NULL,
  delivered_on_site BIT NOT NULL, 
  delivered_online BIT NOT NULL,
  delivered_online_also_onsite VARCHAR(50) NULL, 
  same_online_credits_earned VARCHAR(50) NULL,
  earn_academic_credits_other_institution VARCHAR(50) NULL,
  course_load_calculation VARCHAR(50) NOT NULL,
  average_hours_study INT NULL,
  completion_years VARCHAR(50) NOT NULL,
  admission_requirement VARCHAR(50) NOT NULL,
  has_minimun_age VARCHAR(50) NULL,
  esl_eligibility VARCHAR(50) NOT NULL,
  has_joint_institution VARCHAR(50) NOT NULL,
  has_joint_designated_institution VARCHAR(50) NULL,
  approval_status VARCHAR(50) NOT NULL,
  
  -- Reference Columns
  institution_id INT REFERENCES institutions(id) ON DELETE CASCADE,
  
  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL
);


-- ## Comments
COMMENT ON TABLE education_programs IS 'The main resource table to store education programs related information. Tombstone information to education programs shared across institution locations.';
COMMENT ON COLUMN education_programs.id IS 'Auto-generated sequential primary key column';
COMMENT ON COLUMN education_programs.program_name IS 'Program name';
COMMENT ON COLUMN education_programs.program_description IS 'Program description';
COMMENT ON COLUMN education_programs.credential_type IS 'Credential types like: Diploma, Certificate, Degree, Masters, Doctorate, Other';
COMMENT ON COLUMN education_programs.credential_type_other IS 'Credential type descritpion when "Other" is selected for credential_type';
COMMENT ON COLUMN education_programs.cip_code IS 'Classification of Instructional Programs (CIP) Code';
COMMENT ON COLUMN education_programs.noc_code IS 'National Occupational Classification (NOC)';
COMMENT ON COLUMN education_programs.sabc_code IS 'SABC institution code, if this program has been approved for SABC funding before';
COMMENT ON COLUMN education_programs.regulatory_body IS 'Regulatory body ode. Which regulatory body has approved your delivery of this program';
COMMENT ON COLUMN education_programs.delivered_on_site IS 'How will this Program be delivered - On site';
COMMENT ON COLUMN education_programs.delivered_online IS 'How will this Program be delivered - Online';
COMMENT ON COLUMN education_programs.delivered_online_also_onsite IS 'If the program is delivered online indicates if the same program is also delivered on site';
COMMENT ON COLUMN education_programs.same_online_credits_earned IS 'Indicates if the students will earn the same number of credits in the same time period as students in other StudentAid BC eligible programs delivered on site';
COMMENT ON COLUMN education_programs.earn_academic_credits_other_institution IS 'Indicates if the students will earn academic credits that are recognized at another designated institution listed in the BC Transfer Guide or other acceptable articulation agreements from other jurisdictions';
COMMENT ON COLUMN education_programs.course_load_calculation IS 'Program course load calculation options like "Credit based" or "Hours based"';
COMMENT ON COLUMN education_programs.average_hours_study IS 'Average hours of study';
COMMENT ON COLUMN education_programs.completion_years IS 'Code for years required to complete this program';
COMMENT ON COLUMN education_programs.admission_requirement IS 'Code for the admission requirements for this program';
COMMENT ON COLUMN education_programs.has_minimun_age IS 'Indicates if there is a minimum age requirement';
COMMENT ON COLUMN education_programs.esl_eligibility IS 'Indicates the "English as a Second Language (ESL)" requirement';
COMMENT ON COLUMN education_programs.has_joint_institution IS 'Indicates if the program is offered jointly or in partnership with other institutions';
COMMENT ON COLUMN education_programs.has_joint_designated_institution IS 'When institution has partners this indicates if all institutions you partner with for this program are designated by Student Aid BC';
COMMENT ON COLUMN education_programs.approval_status IS 'Approval status of the record like pending or approved';
COMMENT ON COLUMN education_programs.institution_id IS 'Foreign key reference to institutions table which includes institutions related information';
COMMENT ON COLUMN education_programs.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN education_programs.updated_at IS 'Record update timestamp';
COMMENT ON COLUMN education_programs.creator IS 'Creator of the record. Null specified the record is created by system';
COMMENT ON COLUMN education_programs.modifier IS 'Modifier of the record. Null specified the record is modified by system';
