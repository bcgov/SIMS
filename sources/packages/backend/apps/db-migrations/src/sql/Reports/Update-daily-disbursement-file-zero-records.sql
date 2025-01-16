UPDATE
    sims.report_configs
SET
    report_sql = (
        'WITH disbursement_receipt_dataset AS (
            SELECT
                disbursement_receipts.id,
                disbursement_receipts.total_disbursed_amount,
                disbursement_receipts.total_disbursed_grant_amount,
                disbursement_receipts.funding_type,
                disbursement_receipts.file_date,
                disbursement_receipts.batch_run_date,
                disbursement_receipts.sequence_number
            FROM
                sims.disbursement_receipts disbursement_receipts
            WHERE
                disbursement_receipts.funding_type IN (''BC'', ''BP'')
                AND disbursement_receipts.file_date = :fileDate
                AND disbursement_receipts.sequence_number = :sequenceNumber
        ),
        disbursement_receipts_totals AS (
            SELECT
                SUM(
                    full_time_disbursement_receipts.total_disbursed_amount
                ) AS "Full Time BC Student Loan",
                SUM(
                    full_time_disbursement_receipts.total_disbursed_grant_amount
                ) AS "Full Time BC Student Grant",
                SUM(
                    full_time_disbursement_receipts.total_disbursed_amount + full_time_disbursement_receipts.total_disbursed_grant_amount
                ) AS "Full Time BC Total",
                0 AS "Part Time BC Student Grant",
                0 AS "Part Time BC Total",
                SUM(
                    full_time_disbursement_receipts.total_disbursed_amount + full_time_disbursement_receipts.total_disbursed_grant_amount
                ) AS "BC Total",
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
                    part_time_disbursement_receipts.total_disbursed_grant_amount
                ) AS "Part Time BC Total",
                SUM(
                    part_time_disbursement_receipts.total_disbursed_grant_amount
                ) AS "BC Total",
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
        )
        SELECT
            SUM(
                disbursement_receipts_totals."Full Time BC Student Loan"
            ) AS "Full Time BC Student Loan",
            SUM(
                disbursement_receipts_totals."Full Time BC Student Grant"
            ) AS "Full Time BC Student Grant",
            SUM(disbursement_receipts_totals."Full Time BC Total") AS "Full Time BC Total",
            SUM(
                disbursement_receipts_totals."Part Time BC Student Grant"
            ) AS "Part Time BC Student Grant",
            SUM(disbursement_receipts_totals."Part Time BC Total") AS "Part Time BC Total",
            SUM(disbursement_receipts_totals."BC Total") as "BC Total",
            SUM(disbursement_receipts_totals."Total Records") AS "Total Records",
            CAST(
                disbursement_receipts_totals."File Date" AS varchar
            ) AS "File Date",
            CAST(
                disbursement_receipts_totals."Batch Run Date" AS varchar
            ) AS "Batch Run Date",
            disbursement_receipts_totals."Sequence Number"
        FROM
            disbursement_receipts_totals
        GROUP BY
            disbursement_receipts_totals."File Date",
            disbursement_receipts_totals."Batch Run Date",
            disbursement_receipts_totals."Sequence Number"
        UNION
        -- Empty row with fileDate, sequenceNumber, and NULL for Batch Run Date.
        SELECT
            0 AS "Full Time BC Student Loan",
            0 AS "Full Time BC Student Grant",
            0 AS "Full Time BC Total",
            0 AS "Part Time BC Student Grant",
            0 AS "Part Time BC Total",
            0 AS "BC Total",
            0 AS "Total Records",
            CAST(:fileDate AS varchar) AS "File Date",
            NULL AS "Batch Run Date",
            :sequenceNumber AS "Sequence Number"
        WHERE
            NOT EXISTS (
                SELECT
                    1
                FROM
                    disbursement_receipts_totals
            );'
    )
WHERE
    report_name = 'Daily_Disbursement_File';