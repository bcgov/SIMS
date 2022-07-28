-- Delete reference between application_exception_requests and application_exceptions --
ALTER TABLE
    sims.application_exception_requests DROP CONSTRAINT IF EXISTS application_exception_requests_application_exception_id_fkey;

-- Create reference between application_exception_requests and application_exceptions --
ALTER TABLE
    sims.application_exception_requests
ADD
    CONSTRAINT application_exception_requests_application_exceptions_id_fkey FOREIGN KEY(application_exception_id) REFERENCES sims.application_exceptions(id);

-- Delete reference between student_assessments and applications --
ALTER TABLE
    sims.student_assessments DROP CONSTRAINT IF EXISTS student_assessments_application_id_fkey;

-- Create reference between applications and student_assessments --
ALTER TABLE
    sims.applications
ADD
    CONSTRAINT applications_student_assessments_id_fkey FOREIGN KEY(current_assessment_id) REFERENCES sims.student_assessments(id);

-- Create reference between student_assessments and applications --
ALTER TABLE
    sims.student_assessments
ADD
    CONSTRAINT student_assessments_applications_id_fkey FOREIGN KEY(application_id) REFERENCES sims.applications(id);

-- Delete reference between applications and students --
ALTER TABLE
    sims.applications DROP CONSTRAINT IF EXISTS applications_student_id_fkey;

-- Delete reference between application_student_files and applications --
ALTER TABLE
    sims.application_student_files DROP CONSTRAINT IF EXISTS application_student_files_student_file_id_fkey;

-- Delete reference between cra_income_verifications and supporting_users --
ALTER TABLE
    sims.cra_income_verifications DROP CONSTRAINT IF EXISTS cra_income_verifications_supporting_user_id_fkey;

-- Delete reference between cra_income_verifications and applications --
ALTER TABLE
    sims.cra_income_verifications DROP CONSTRAINT IF EXISTS cra_income_verifications_application_id_fkey;

-- Delete reference between designation_agreements and institutions --
ALTER TABLE
    sims.designation_agreements DROP CONSTRAINT IF EXISTS designation_agreements_institution_id_fkey;

-- Delete reference between designation_agreement_locations and designation_agreements --
ALTER TABLE
    sims.designation_agreement_locations DROP CONSTRAINT IF EXISTS designation_agreement_locations_designation_agreement_id_fkey;

-- Delete reference between designation_agreement_locations and institution_locations --
ALTER TABLE
    sims.designation_agreement_locations DROP CONSTRAINT IF EXISTS designation_agreement_locations_location_id_fkey;

-- Delete reference between disbursement_feedback_errors and disbursement_schedules --
ALTER TABLE
    sims.disbursement_feedback_errors DROP CONSTRAINT IF EXISTS disbursement_feedback_errors_disbursement_schedule_id_fkey;

-- Delete reference between disbursement_schedules and student_assessments --
ALTER TABLE
    sims.disbursement_schedules DROP CONSTRAINT IF EXISTS disbursement_schedules_student_assessment_id_fkey;

-- Delete reference between disbursement_values and disbursement_schedules --
ALTER TABLE
    sims.disbursement_values DROP CONSTRAINT IF EXISTS disbursement_values_disbursement_schedule_id_fkey;

-- Delete reference between education_programs and institutions --
ALTER TABLE
    sims.education_programs DROP CONSTRAINT IF EXISTS education_programs_institution_id_fkey;

-- Delete reference between education_programs_offerings and education_programs --
ALTER TABLE
    sims.education_programs_offerings DROP CONSTRAINT IF EXISTS education_programs_offerings_program_id_fkey;

-- Delete reference between education_programs_offerings and institution_locations --
ALTER TABLE
    sims.education_programs_offerings DROP CONSTRAINT IF EXISTS education_programs_offerings_location_id_fkey;

-- Delete reference between institution_users and institutions --
ALTER TABLE
    sims.institution_users DROP CONSTRAINT IF EXISTS fk_institution_id_202105180002;

-- Delete reference between institution_users and users --
ALTER TABLE
    sims.institution_users DROP CONSTRAINT IF EXISTS fk_institution_user_id_202105180001;

-- Delete reference between institution_user_auth and institution_users --
ALTER TABLE
    sims.institution_user_auth DROP CONSTRAINT IF EXISTS fk_institution_user_auth_user_id_202105180040;

-- Delete reference between institution_user_auth and institution_locations --
ALTER TABLE
    sims.institution_user_auth DROP CONSTRAINT IF EXISTS fk_institution_user_auth_location_id_202105180045;

-- Delete reference between institution_user_auth and institution_user_type_roles --
ALTER TABLE
    sims.institution_user_auth DROP CONSTRAINT IF EXISTS fk_institution_user_auth_type_role_202105180050;

-- Delete reference between institution_locations and institutions --
ALTER TABLE
    sims.institution_locations DROP CONSTRAINT IF EXISTS institution_locations_institution_id_fkey;

-- Delete reference between institution_users and institutions --
ALTER TABLE
    sims.institution_users DROP CONSTRAINT IF EXISTS fk_institution_id_202105180002;

-- Delete reference between msfaa_numbers and students --
ALTER TABLE
    sims.msfaa_numbers DROP CONSTRAINT IF EXISTS msfaa_numbers_student_id_fkey;

-- Delete reference between sin_validations and users --
ALTER TABLE
    sims.sin_validations DROP CONSTRAINT IF EXISTS sin_validations_user_id_fkey;

-- Delete reference between students and users --
ALTER TABLE
    sims.students DROP CONSTRAINT IF EXISTS students_user_id_fkey;

-- Delete reference between student_appeal_requests and student_appeals --
ALTER TABLE
    sims.student_appeal_requests DROP CONSTRAINT IF EXISTS student_appeal_requests_student_appeal_id_fkey;

-- Delete reference between student_appeals and applications --
ALTER TABLE
    sims.student_appeals DROP CONSTRAINT IF EXISTS student_appeals_application_id_fkey;

-- Delete reference between student_assessments and education_programs_offerings --
ALTER TABLE
    sims.student_assessments DROP CONSTRAINT IF EXISTS student_assessments_offering_id_fkey;

-- Delete reference between student_assessments and student_appeals --
ALTER TABLE
    sims.student_assessments DROP CONSTRAINT IF EXISTS student_assessments_student_appeal_id_fkey;

-- Delete reference between student_assessments and student_scholastic_standings --
ALTER TABLE
    sims.student_assessments DROP CONSTRAINT IF EXISTS student_assessments_student_scholastic_standing_id_fkey;

-- Delete reference between student_files and students --
ALTER TABLE
    sims.student_files DROP CONSTRAINT IF EXISTS student_files_student_id_fkey;

-- Delete reference between student_scholastic_standings and applications --
ALTER TABLE
    sims.student_scholastic_standings DROP CONSTRAINT IF EXISTS student_scholastic_standings_application_id_fkey;

-- Delete reference between supporting_users and users --
ALTER TABLE
    sims.supporting_users DROP CONSTRAINT IF EXISTS supporting_users_user_id_fkey;

-- Delete reference between supporting_users and applications --
ALTER TABLE
    sims.supporting_users DROP CONSTRAINT IF EXISTS supporting_users_application_id_fkey;