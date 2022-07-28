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