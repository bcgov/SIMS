INSERT INTO
    sims.report_configs (report_name, report_sql)
VALUES
    (
        'ECert_Errors_Report',
        'select
        disbursement_schedules.id as "eCert Number",
        applications.application_number as "Application Number",
        users.first_name as "First Name",
        users.last_name as "Last Name",
        students.birth_date as "Date of Birth",
        disbursement_feedback_errors.feedback_file_name as "Feedback File Name",
        education_programs_offerings.study_start_date as "Study Start Date",
        education_programs_offerings.study_end_date as "Study End Date",
        to_char(disbursement_feedback_errors.date_received,''YYYY-MM-DD'') as "Error Logged Date",
        STRING_AGG(ecert_feedback_errors.error_code,'', '') as "Error Codes"
    from
        sims.disbursement_feedback_errors
    inner join sims.ecert_feedback_errors on
        ecert_feedback_errors.id = disbursement_feedback_errors.ecert_feedback_error_id
    inner join sims.disbursement_schedules on
        disbursement_schedules.id = disbursement_feedback_errors.disbursement_schedule_id
    inner join sims.student_assessments on
        student_assessments.id = disbursement_schedules.student_assessment_id
    inner join sims.education_programs_offerings on
        education_programs_offerings.id = student_assessments.offering_id
    inner join sims.applications on
        applications.id = student_assessments.application_id
    inner join sims.students on
        students.id = applications.student_id
    inner join sims.users on
        users.id = students.user_id
    where
        education_programs_offerings.offering_intensity = any(:offeringIntensity)
        and disbursement_feedback_errors.date_received between :startDate
                and :endDate
    group by
        disbursement_schedules.id,
        applications.application_number,
        users.first_name,
        users.last_name,
        students.birth_date,
        disbursement_feedback_errors.feedback_file_name,
        education_programs_offerings.study_start_date,
        education_programs_offerings.study_end_date,
        disbursement_feedback_errors.date_received
    order by
        disbursement_schedules.id;'
    );