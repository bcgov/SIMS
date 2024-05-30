INSERT INTO 
    sims.report_configs (report_name, report_sql)
VALUES 
    (
    'ECert_Errors_Report',
    'SELECT
        ds.id AS "eCert Number",
        a.application_number AS "Application Number",
        u.first_name AS "First Name",
        u.last_name AS "Last Name",
        s.birth_date AS "DOB",
        dfe.feedback_file_name AS "Feedback File Name",
        epo.study_start_date AS "Study Start Date",
        epo.study_end_date AS "Study End Date",
        dfe.date_received AS "Error Logged Date",
        STRING_AGG(efe.error_code, ', ') AS "Error Codes"
    FROM
        disbursement_feedback_errors dfe
    INNER JOIN ecert_feedback_errors efe ON
        efe.id = dfe.ecert_feedback_error_id 
    INNER JOIN disbursement_schedules ds ON
        ds.id = dfe.disbursement_schedule_id
    INNER JOIN student_assessments sa ON
        sa.id = ds.student_assessment_id
    INNER JOIN education_programs_offerings epo ON
        epo.id = sa.offering_id 
    INNER JOIN applications a ON
        a.id = sa.application_id
    INNER JOIN students s ON
        s.id = a.student_id
    INNER JOIN users u ON
        u.id = s.user_id
    WHERE
        epo.offering_intensity = ANY(:offeringIntensity)
        AND dfe.date_received BETWEEN :startDate AND :endDate
    GROUP BY
        ds.id,
        a.application_number,
        u.first_name,
        u.last_name,
        s.birth_date,
        dfe.feedback_file_name,
        epo.study_start_date,
        epo.study_end_date,
        dfe.date_received
    ORDER BY
        ds.id');
