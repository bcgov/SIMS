INSERT INTO
    sims.report_configs (report_name, report_sql)
VALUES
    (
        'CAS_Supplier_Maintenance_Updates_Report',
        'WITH cas_supplier_report AS (
            SELECT
                student_user.first_name AS student_first_name,
                student_user.last_name AS student_last_name,
                student_user.identity_provider_type AS student_profile_type,
                student.updated_at AS student_updated_date,
                student.disability_status AS student_disability_status,
                sin_validation.sin AS student_sin,
                student.contact_info -> ''address'' ->> ''addressLine1'' AS student_address_line_1,
                student.contact_info -> ''address'' ->> ''city'' AS student_city,
                student.contact_info -> ''address'' ->> ''provinceState'' AS student_province,
                student.contact_info -> ''address'' ->> ''postalCode'' AS student_postal_code,
                student.contact_info -> ''address'' ->> ''country'' AS student_country,
                cas_supplier.supplier_number AS cas_supplier,
                cas_supplier.supplier_protected AS cas_supplier_protected,
                cas_supplier.supplier_address ->> ''supplierSiteCode'' AS cas_site,
                cas_supplier.supplier_address ->> ''siteProtected'' AS cas_site_protected,
                cas_supplier.supplier_status_updated_on AS cas_supplier_verified_date,
                cas_supplier.student_profile_snapshot ->> ''firstName'' AS cas_snapshot_first_name,
                cas_supplier.student_profile_snapshot ->> ''lastName'' AS cas_snapshot_last_name,
                cas_supplier.student_profile_snapshot ->> ''sin'' AS cas_snapshot_sin,
                cas_supplier.student_profile_snapshot ->> ''addressLine1'' AS cas_snapshot_address_line_1,
                cas_supplier.student_profile_snapshot ->> ''city'' AS cas_snapshot_city,
                cas_supplier.student_profile_snapshot ->> ''province'' AS cas_snapshot_province,
                cas_supplier.student_profile_snapshot ->> ''postalCode'' AS cas_snapshot_postal_code,
                cas_supplier.student_profile_snapshot ->> ''country'' AS cas_snapshot_country
            FROM
                sims.students student
                INNER JOIN sims.cas_suppliers cas_supplier on student.cas_supplier_id = cas_supplier.id
                INNER JOIN sims.users student_user on student.user_id = student_user.id
                INNER JOIN sims.sin_validations sin_validation on student.sin_validation_id = sin_validation.id
            WHERE
                cas_supplier.is_valid = true
                AND (
                    (
                        (
                            cas_supplier.student_profile_snapshot ->> ''firstName''
                        ) IS DISTINCT
                        FROM
                            student_user.first_name
                    )
                    OR (
                        (
                            cas_supplier.student_profile_snapshot ->> ''lastName''
                        ) IS DISTINCT
                        FROM
                            student_user.last_name
                    )
                    OR (
                        (
                            cas_supplier.student_profile_snapshot ->> ''sin''
                        ) IS DISTINCT
                        FROM
                            sin_validation.sin
                    )
                    OR (
                        (
                            cas_supplier.student_profile_snapshot ->> ''addressLine1''
                        ) IS DISTINCT
                        FROM
                            (
                                student.contact_info -> ''address'' ->> ''addressLine1''
                            )
                    )
                    OR (
                        (
                            cas_supplier.student_profile_snapshot ->> ''city''
                        ) IS DISTINCT
                        FROM
                            (
                                student.contact_info -> ''address'' ->> ''city''
                            )
                    )
                    OR (
                        (
                            cas_supplier.student_profile_snapshot ->> ''province''
                        ) IS DISTINCT
                        FROM
                            (
                                student.contact_info -> ''address'' ->> ''provinceState''
                            )
                    )
                    OR (
                        (
                            cas_supplier.student_profile_snapshot ->> ''postalCode''
                        ) IS DISTINCT
                        FROM
                            (
                                student.contact_info -> ''address'' ->> ''postalCode''
                            )
                    )
                    OR (
                        (
                            cas_supplier.student_profile_snapshot ->> ''country''
                        ) IS DISTINCT
                        FROM
                            (
                                student.contact_info -> ''address'' ->> ''country''
                            )
                    )
                )
        )
        SELECT
            cas_supplier_report.student_first_name AS "Given Names",
            cas_supplier_report.student_last_name AS "Last Name",
            cas_supplier_report.student_sin AS "SIN",
            cas_supplier_report.student_address_line_1 AS "Address Line 1",
            cas_supplier_report.student_city AS "City",
            cas_supplier_report.student_province AS "Province",
            cas_supplier_report.student_postal_code AS "Postal Code",
            cas_supplier_report.student_country AS "Country",
            cas_supplier_report.student_disability_status AS "Disability Status",
            cas_supplier_report.student_profile_type AS "Profile Type",
            TO_CHAR(
                cas_supplier_report.student_updated_date,
                ''YYYY - MM - DD''
            ) AS "Student Updated Date",
            cas_supplier_report.cas_supplier AS "Supplier",
            cas_supplier_report.cas_site AS "Site",
            cas_supplier_report.cas_supplier_protected AS "Protected Supplier",
            cas_supplier_report.cas_site_protected AS "Protected Site",
            TO_CHAR(
                cas_supplier_report.cas_supplier_verified_date,
                ''YYYY - MM - DD''
            ) AS "Supplier Verified Date",
            CASE
                WHEN (
                    cas_supplier_report.student_first_name IS DISTINCT
                    FROM
                        cas_supplier_report.cas_snapshot_first_name
                ) THEN ''Yes''
                ELSE ''No''
            END "First Name Updated",
            CASE
                WHEN (
                    cas_supplier_report.student_last_name IS DISTINCT
                    FROM
                        cas_supplier_report.cas_snapshot_last_name
                ) THEN ''Yes''
                ELSE ''No''
            END "Last Name Updated",
            CASE
                WHEN (
                    cas_supplier_report.student_sin IS DISTINCT
                    FROM
                        cas_supplier_report.cas_snapshot_sin
                ) THEN ''Yes''
                ELSE ''No''
            END "SIN Updated",
            CASE
                WHEN (
                    cas_supplier_report.student_address_line_1 IS DISTINCT
                    FROM
                        cas_supplier_report.cas_snapshot_address_line_1
                ) THEN ''Yes''
                ELSE ''No''
            END "Address Line 1 Updated",
            CASE
                WHEN (
                    cas_supplier_report.student_city IS DISTINCT
                    FROM
                        cas_supplier_report.cas_snapshot_city
                ) THEN ''Yes''
                ELSE ''No''
            END "City Updated",
            CASE
                WHEN (
                    cas_supplier_report.student_province IS DISTINCT
                    FROM
                        cas_supplier_report.cas_snapshot_province
                ) THEN ''Yes''
                ELSE ''No''
            END "Province Updated",
            CASE
                WHEN (
                    cas_supplier_report.student_postal_code IS DISTINCT
                    FROM
                        cas_supplier_report.cas_snapshot_postal_code
                ) THEN ''Yes''
                ELSE ''No''
            END "Postal Code Updated",
            CASE
                WHEN (
                    cas_supplier_report.student_country IS DISTINCT
                    FROM
                        cas_supplier_report.cas_snapshot_country
                ) THEN ''Yes''
                ELSE ''No''
            END "Country Updated"
        FROM
            cas_supplier_report
        ORDER BY
            student_updated_date;'
    );