-- Create reference between application_exception_requests and application_exceptions --
ALTER TABLE
    sims.application_exception_requests
ADD
    CONSTRAINT application_exception_requests_application_exceptions_id_fkey FOREIGN KEY(application_exception_id) REFERENCES sims.application_exceptions(id);

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

-- Create reference between application_student_files and applications --
ALTER TABLE
    sims.application_student_files
ADD
    CONSTRAINT application_student_files_student_file_id_fkey FOREIGN KEY(application_id) REFERENCES sims.applications(id);

-- Create reference between cra_income_verifications and supporting_users --
ALTER TABLE
    sims.cra_income_verifications
ADD
    CONSTRAINT cra_income_verifications_supporting_user_id_fkey FOREIGN KEY(supporting_user_id) REFERENCES sims.supporting_users(id);

-- Create reference between cra_income_verifications and applications --
ALTER TABLE
    sims.cra_income_verifications
ADD
    CONSTRAINT cra_income_verifications_application_id_fkey FOREIGN KEY(application_id) REFERENCES sims.applications(id);

-- Create reference between designation_agreements and institutions --
ALTER TABLE
    sims.designation_agreements
ADD
    CONSTRAINT designation_agreements_institution_id_fkey FOREIGN KEY(institution_id) REFERENCES sims.institutions(id);

-- Create reference between designation_agreement_locations and designation_agreements --
ALTER TABLE
    sims.designation_agreement_locations
ADD
    CONSTRAINT designation_agreement_locations_designation_agreement_id_fkey FOREIGN KEY(designation_agreement_id) REFERENCES sims.designation_agreements(id);

-- Create reference between designation_agreement_locations and institution_locations --
ALTER TABLE
    sims.designation_agreement_locations
ADD
    CONSTRAINT designation_agreement_locations_location_id_fkey FOREIGN KEY(location_id) REFERENCES sims.institution_locations(id);

-- Create reference between disbursement_feedback_errors and disbursement_schedules --
ALTER TABLE
    sims.disbursement_feedback_errors
ADD
    CONSTRAINT disbursement_feedback_errors_disbursement_schedule_id_fkey FOREIGN KEY(disbursement_schedule_id) REFERENCES sims.disbursement_schedules(id);