-- Alter created_at column in applications to include timestamp with time zone. --
ALTER TABLE
    sims.applications
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in applications to include timestamp with time zone. --
ALTER TABLE
    sims.applications
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in application_student_files to include timestamp with time zone. --
ALTER TABLE
    sims.application_student_files
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in application_student_files to include timestamp with time zone. --
ALTER TABLE
    sims.application_student_files
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in institution_user_type_roles to include timestamp with time zone. --
ALTER TABLE
    sims.institution_user_type_roles
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in institution_user_type_roles to include timestamp with time zone. --
ALTER TABLE
    sims.institution_user_type_roles
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in coe_denied_reasons to include timestamp with time zone. --
ALTER TABLE
    sims.coe_denied_reasons
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in coe_denied_reasons to include timestamp with time zone. --
ALTER TABLE
    sims.coe_denied_reasons
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in cra_income_verifications to include timestamp with time zone. --
ALTER TABLE
    sims.cra_income_verifications
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in cra_income_verifications to include timestamp with time zone. --
ALTER TABLE
    sims.cra_income_verifications
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in education_programs to include timestamp with time zone. --
ALTER TABLE
    sims.education_programs
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in education_programs to include timestamp with time zone. --
ALTER TABLE
    sims.education_programs
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in education_programs_offerings to include timestamp with time zone. --
ALTER TABLE
    sims.education_programs_offerings
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in education_programs_offerings to include timestamp with time zone. --
ALTER TABLE
    sims.education_programs_offerings
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in institutions to include timestamp with time zone. --
ALTER TABLE
    sims.institutions
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in institutions to include timestamp with time zone. --
ALTER TABLE
    sims.institutions
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in institution_users to include timestamp with time zone. --
ALTER TABLE
    sims.institution_users
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in institution_users to include timestamp with time zone. --
ALTER TABLE
    sims.institution_users
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in institution_user_auth to include timestamp with time zone. --
ALTER TABLE
    sims.institution_user_auth
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in institution_user_auth to include timestamp with time zone. --
ALTER TABLE
    sims.institution_user_auth
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in institution_locations to include timestamp with time zone. --
ALTER TABLE
    sims.institution_locations
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in institution_locations to include timestamp with time zone. --
ALTER TABLE
    sims.institution_locations
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in institution_type to include timestamp with time zone. --
ALTER TABLE
    sims.institution_type
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in institution_type to include timestamp with time zone. --
ALTER TABLE
    sims.institution_type
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in institution_users to include timestamp with time zone. --
ALTER TABLE
    sims.institution_users
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in institution_users to include timestamp with time zone. --
ALTER TABLE
    sims.institution_users
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in msfaa_numbers to include timestamp with time zone. --
ALTER TABLE
    sims.msfaa_numbers
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in msfaa_numbers to include timestamp with time zone. --
ALTER TABLE
    sims.msfaa_numbers
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in pir_denied_reason to include timestamp with time zone. --
ALTER TABLE
    sims.pir_denied_reason
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in pir_denied_reason to include timestamp with time zone. --
ALTER TABLE
    sims.pir_denied_reason
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in program_years to include timestamp with time zone. --
ALTER TABLE
    sims.program_years
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in program_years to include timestamp with time zone. --
ALTER TABLE
    sims.program_years
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in federal_restrictions to include timestamp with time zone. --
ALTER TABLE
    sims.federal_restrictions
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in restrictions to include timestamp with time zone. --
ALTER TABLE
    sims.restrictions
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in restrictions to include timestamp with time zone. --
ALTER TABLE
    sims.restrictions
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in student_restrictions to include timestamp with time zone. --
ALTER TABLE
    sims.student_restrictions
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in student_restrictions to include timestamp with time zone. --
ALTER TABLE
    sims.student_restrictions
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in sequence_controls to include timestamp with time zone. --
ALTER TABLE
    sims.sequence_controls
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in sequence_controls to include timestamp with time zone. --
ALTER TABLE
    sims.sequence_controls
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in students to include timestamp with time zone. --
ALTER TABLE
    sims.students
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in students to include timestamp with time zone. --
ALTER TABLE
    sims.students
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in student_files to include timestamp with time zone. --
ALTER TABLE
    sims.student_files
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in student_files to include timestamp with time zone. --
ALTER TABLE
    sims.student_files
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in supporting_users to include timestamp with time zone. --
ALTER TABLE
    sims.supporting_users
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in supporting_users to include timestamp with time zone. --
ALTER TABLE
    sims.supporting_users
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter created_at column in users to include timestamp with time zone. --
ALTER TABLE
    sims.users
ALTER COLUMN
    created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Alter updated_at column in users to include timestamp with time zone. --
ALTER TABLE
    sims.users
ALTER COLUMN
    updated_at TYPE TIMESTAMP WITH TIME ZONE;