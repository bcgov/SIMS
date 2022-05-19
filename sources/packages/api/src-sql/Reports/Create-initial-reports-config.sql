--Insert config for disbursement forecast report.
INSERT INTO
    sims.reports_config (report_name, report_sql)
VALUES
    (
        'disbursement-forecast-report',
        'select ds.disbursement_date, dv.value_code, sum(dv.value_amount), count(ap.id) from sims.disbursement_schedules ds 
        inner join sims.student_assessments sa on ds.student_assessment_id = sa.id 
        inner join sims.applications ap on sa.id = ap.current_assessment_id 
        inner join sims.education_programs_offerings epo on sa.offering_id = epo.id 
        inner join sims.disbursement_values dv on dv.disbursement_schedule_id = ds.id 
        where epo.offering_intensity = ANY(:offeringIntensity) 
        and ds.disbursement_date between :startDate and :endDate 
        group by ds.disbursement_date, dv.value_code order by ds.disbursement_date'
    );