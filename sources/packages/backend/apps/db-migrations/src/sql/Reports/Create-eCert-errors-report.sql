INSERT INTO
    sims.report_configs (report_name, report_sql)
VALUES
    (
        'ECert_Errors_Report',
        'select
            ds.id as "eCert Number",
            a.application_number  as "Application Number",
            u.first_name  as "First Name",
            u.last_name as "Last Name",
            s.birth_date  as "DOB",
            dfe.feedback_file_name as "Feedback File Name",
            epo.study_start_date  as "Study Start Date",
            epo.study_end_date as "Study End Date",
            dfe.date_received as "Error Logged Date",
            efe.error_code as "Error Codes"
        from
            disbursement_feedback_errors dfe
        inner join ecert_feedback_errors efe on
            efe.id = dfe.ecert_feedback_error_id 
        inner join disbursement_schedules ds on
            ds.id = dfe.disbursement_schedule_id
        inner join student_assessments sa on
            sa.id = ds.student_assessment_id
        inner join education_programs_offerings epo on
            epo.id = sa.offering_id 
        inner join applications a on
            a.id = sa.application_id
        inner join students s on
            s.id = a.student_id
        inner join users u on
            u.id = s.user_id
        where epo.offering_intensity = any(:offeringIntensity)
                and dfe.date_received between :startDate
                and :endDate
        order by ds.id');