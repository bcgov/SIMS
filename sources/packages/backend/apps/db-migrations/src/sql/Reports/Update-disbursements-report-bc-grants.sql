UPDATE
    sims.report_configs
SET
    report_sql = (
        '(select
        to_char(dr.disburse_date, ''YYYY-MM-DD'') as "Date of Disbursement",
        dr.student_sin as "SIN",
        app.application_number as "Application Number",
        ds.document_number as "Certificate Number",
        drv.grant_type as "Funding Code",
        drv.grant_amount as "Disbursement Amount"
      from
        sims.disbursement_receipts dr
        inner join sims.disbursement_receipt_values drv on drv.disbursement_receipt_id = dr.id
        inner join sims.disbursement_schedules ds on ds.id = dr.disbursement_schedule_id
        inner join sims.student_assessments sa on sa.id = ds.student_assessment_id
        inner join sims.applications app on app.id = sa.application_id
        inner join sims.education_programs_offerings epo on epo.id = sa.offering_id
      where
        epo.offering_intensity = any(:offeringIntensity)
        and dr.disburse_date between :startDate
        and :endDate
      union
      all
      select
        to_char(dr.disburse_date, ''YYYY-MM-DD'') as "Date of Disbursement",
        dr.student_sin as "SIN",
        app.application_number as "Application Number",
        ds.document_number as "Certificate Number",
        case
          when dr.funding_type = ''BC'' then ''BCSL''
          when dr.funding_type = ''FE'' then ''CSL''
        end as "Funding Code",
        dr.total_disbursed_amount as "Disbursement Amount"
      from
        sims.disbursement_receipts dr
        inner join sims.disbursement_schedules ds on ds.id = dr.disbursement_schedule_id
        inner join sims.student_assessments sa on sa.id = ds.student_assessment_id
        inner join sims.applications app on app.id = sa.application_id
        inner join sims.education_programs_offerings epo on epo.id = sa.offering_id
      where
        epo.offering_intensity = any(:offeringIntensity)
        and dr.disburse_date between :startDate
        and :endDate
      union
      all
      select distinct
        to_char(dr.disburse_date, ''YYYY-MM-DD'') as "Date of Disbursement",
        dr.student_sin as "SIN",
        app.application_number as "Application Number",
        ds.document_number as "Certificate Number",
        dv.value_code as "Funding Code",
        dv.value_amount as "Disbursement Amount"
    from
        sims.disbursement_receipts dr
        inner join sims.disbursement_schedules ds on ds.id = dr.disbursement_schedule_id
        inner join sims.disbursement_values dv on dv.disbursement_schedule_id = ds.id
        inner join sims.student_assessments sa on sa.id = ds.student_assessment_id
        inner join sims.applications app on app.id = sa.application_id
        inner join sims.education_programs_offerings epo on epo.id = sa.offering_id
    where
        epo.offering_intensity = any(:offeringIntensity)
        and dv.value_type = ''BC Grant''
        and dr.disburse_date between :startDate
        and :endDate
    )
    order by
      "Date of Disbursement",
      "Certificate Number"'
    )
WHERE
    report_name = 'Disbursement_Report';