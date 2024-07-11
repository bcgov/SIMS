UPDATE
    sims.report_configs
SET
    report_sql = (
        'WITH disbursement_receipt_dataset AS (
            SELECT
                *
            FROM
                sims.disbursement_receipts disbursement_receipts
            WHERE
                disbursement_receipts.funding_type IN (''BC'', ''BP'')
                AND disbursement_receipts.batch_run_date = :batchRunDate
        )
        SELECT
            SUM(
                disbursement_receipts."Full Time BC Student Loan"
            ) AS "Full Time BC Student Loan",
            SUM(
                disbursement_receipts."Full Time BC Student Grant"
            ) AS "Full Time BC Student Grant",
            SUM(disbursement_receipts."Full Time BC Total") AS "Full Time BC Total",
            SUM(
                disbursement_receipts."Part Time BC Student Grant"
            ) AS "Part Time BC Student Grant",
            SUM(disbursement_receipts."Part Time BC Total") AS "Part Time BC Total",
            SUM(disbursement_receipts."Total Records") AS "Total Records",
            CAST(
                disbursement_receipts."File Date" AS varchar
            ) AS "File Date",
            CAST(
                disbursement_receipts."Batch Run Date" AS varchar
            ) AS "Batch Run Date",
            disbursement_receipts."Sequence Number"
        FROM
            (
                SELECT
                    SUM(
                        full_time_disbursement_receipts.total_disbursed_amount
                    ) AS "Full Time BC Student Loan",
                    SUM(
                        full_time_disbursement_receipts.total_disbursed_grant_amount
                    ) AS "Full Time BC Student Grant",
                    SUM(
                        full_time_disbursement_receipts.total_disbursed_amount
                    ) AS "Full Time BC Total",
                    0 AS "Part Time BC Student Grant",
                    0 AS "Part Time BC Total",
                    COUNT(full_time_disbursement_receipts.id) AS "Total Records",
                    full_time_disbursement_receipts.file_date AS "File Date",
                    full_time_disbursement_receipts.batch_run_date AS "Batch Run Date",
                    full_time_disbursement_receipts.sequence_number AS "Sequence Number"
                FROM
                    disbursement_receipt_dataset full_time_disbursement_receipts
                WHERE
                    full_time_disbursement_receipts.funding_type = ''BC''
                GROUP BY
                    "File Date",
                    "Batch Run Date",
                    "Sequence Number"
                UNION
                ALL
                SELECT
                    0 AS "Full Time BC Student Loan",
                    0 AS "Full Time BC Student Grant",
                    0 AS "Full Time BC Total",
                    SUM(
                        part_time_disbursement_receipts.total_disbursed_grant_amount
                    ) AS "Part Time BC Student Grant",
                    SUM(
                        part_time_disbursement_receipts.total_disbursed_amount
                    ) AS "Part Time BC Total",
                    COUNT(part_time_disbursement_receipts.id) AS "Total Records",
                    part_time_disbursement_receipts.file_date as "File Date",
                    part_time_disbursement_receipts.batch_run_date as "Batch Run Date",
                    part_time_disbursement_receipts.sequence_number as "Sequence Number"
                FROM
                    disbursement_receipt_dataset part_time_disbursement_receipts
                WHERE
                    part_time_disbursement_receipts.funding_type = ''BP''
                GROUP BY
                    "File Date",
                    "Batch Run Date",
                    "Sequence Number"
            ) AS disbursement_receipts
        GROUP BY
            disbursement_receipts."File Date",
            disbursement_receipts."Batch Run Date",
            disbursement_receipts."Sequence Number";'
    )
WHERE
    report_name = 'Daily_Disbursement_File';