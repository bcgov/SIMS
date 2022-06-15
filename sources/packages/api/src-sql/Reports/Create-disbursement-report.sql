--Insert config for disbursement report.
INSERT INTO
    sims.report_configs (report_name, report_sql)
VALUES
    (
        'Disbursement_Report',
        'SELECT "Date of Disbursement",
            "SIN",
            "Application Number",
            "Certificate Number",
            "Funding Code",
            "Disbursement amount"
          FROM
            (SELECT DR.DISBURSE_DATE AS "Date of Disbursement",
                DR.STUDENT_SIN AS "SIN",
                SA.APPLICATION_ID AS "Application Number",
                DS.DOCUMENT_NUMBER AS "Certificate Number",
                DRV.GRANT_TYPE AS "Funding Code",
                DRV.GRANT_AMOUNT AS "Disbursement amount",
                EPO.OFFERING_INTENSITY AS "Offering intensity"
              FROM SIMS.DISBURSEMENT_RECEIPTS DR
              INNER JOIN SIMS.DISBURSEMENT_RECEIPT_VALUES DRV ON DRV.DISBURSEMENT_RECEIPT_ID = DR.ID
              INNER JOIN SIMS.DISBURSEMENT_SCHEDULES DS ON DS.ID = DR.DISBURSEMENT_SCHEDULE_ID
              INNER JOIN SIMS.STUDENT_ASSESSMENTS SA ON SA.ID = DS.STUDENT_ASSESSMENT_ID
              INNER JOIN SIMS.EDUCATION_PROGRAMS_OFFERINGS EPO ON EPO.ID = SA.OFFERING_ID
              UNION ALL SELECT DR.DISBURSE_DATE AS "Date of Disbursement",
                DR.STUDENT_SIN AS "SIN",
                SA.APPLICATION_ID AS "Application Number",
                DS.DOCUMENT_NUMBER AS "Certificate Number",
                CASE
                        WHEN DR.FUNDING_TYPE = ''BC'' THEN ''BCSL''
                        WHEN DR.FUNDING_TYPE = ''FE'' THEN ''CSL''
                END AS "Funding Code",
                DR.TOTAL_DISBURSED_AMOUNT AS "Disbursement amount",
                EPO.OFFERING_INTENSITY AS "Offering intensity"
              FROM SIMS.DISBURSEMENT_RECEIPTS DR
              INNER JOIN SIMS.DISBURSEMENT_SCHEDULES DS ON DS.ID = DR.DISBURSEMENT_SCHEDULE_ID
              INNER JOIN SIMS.STUDENT_ASSESSMENTS SA ON SA.ID = DS.STUDENT_ASSESSMENT_ID
              INNER JOIN SIMS.EDUCATION_PROGRAMS_OFFERINGS EPO ON EPO.ID = SA.OFFERING_ID) AS DATA
          WHERE "Offering intensity" = ANY(:offeringIntensity)
            AND "Date of Disbursement" BETWEEN :startDate AND :endDate
          ORDER BY "Date of Disbursement",
            "Certificate Number"'
    );