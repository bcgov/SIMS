INSERT INTO
    sims.report_configs (report_name, report_sql)
VALUES
    (
        'COE_Requests',
        'select
            student_user.first_name as "Student First Name",
            student_user.last_name as "Student Last Name",
            sin_validation.sin as "SIN",
            application.data ->> '' studentNumber '' as "Student Number",
            student_user.email as "Student Email Address",
            student.contact_info ->> '' phone '' as "Student Phone Number",
            application.application_number as "Application Number",
            cast(assessment.assessment_date as varchar) as "Assessment Date",
            program.program_name as "Program Name",
            offering.offering_name as "Offering Name",
            offering.offering_intensity as "Study Intensity",
            student.disability_status as "Profile Disability Status",
            assessment.workflow_data -> '' calculatedData '' ->> '' pdppdStatus '' as "Application Disability Status",
            cast(offering.study_start_date as varchar) as "Study Start Date",
            cast(offering.study_end_date as varchar) as "Study End Date",
            disbursement.coe_status as "COE Status",
            cast(disbursement.coe_updated_at as varchar) as "COE Actioned",
            disbursement.tuition_remittance_requested_amount as "Remittance Requested",
            disbursement.tuition_remittance_effective_amount as "Remittance Disbursed",
            (
                select
                    SUM(disbursement_value.value_amount)
                from
                    sims.disbursement_values disbursement_value
                where
                    disbursement_value.disbursement_schedule_id = disbursement.id
                    and disbursement_value.value_code != '' BCSG ''
            ) as "Estimated Disbursement Amount",
            case
                when disbursement.disbursement_schedule_status IN ('' Sent '', '' Ready to send '') then cast(disbursement.date_sent as varchar)
                else cast(disbursement.disbursement_date as varchar)
            end as "Disbursement Date"
        from
            sims.disbursement_schedules disbursement
            inner join sims.student_assessments assessment on disbursement.student_assessment_id = assessment.id
            inner join sims.education_programs_offerings offering on assessment.offering_id = offering.id
            inner join sims.education_programs program on offering.program_id = program.id
            inner join sims.applications application on assessment.application_id = application.id
            inner join sims.students student on application.student_id = student.id
            inner join sims.users student_user on student.user_id = student_user.id
            inner join sims.sin_validations sin_validation on student.sin_validation_id = sin_validation.id
        where
            application.current_assessment_id = assessment.id
            and application.application_status in ('' Enrolment '', '' Completed '')
            and application.is_archived = false
            and application.program_year_id = :programYear
            and offering.offering_intensity = ANY(:offeringIntensity)
        order by
            case
                when disbursement.coe_status = '' Required '' then 0
                when disbursement.coe_status = '' Completed '' then 1
                else 2
            end,
            disbursement.created_at;'
    );