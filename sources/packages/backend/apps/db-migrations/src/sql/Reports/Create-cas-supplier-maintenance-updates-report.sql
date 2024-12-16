INSERT INTO
    sims.report_configs (report_name, report_sql)
VALUES
    (
        'CAS_Supplier_Maintenance_Updates_Report',
        'WITH cas_supplier_report AS (
            SELECT
                COALESCE(student_user.first_name, '''') AS student_first_name,
                student_user.last_name AS student_last_name,
                student_user.identity_provider_type AS student_profile_type,
                student.updated_at AS student_updated_date,
                student.disability_status AS student_disability_status,
                sin_validation.sin AS student_sin,
                student.contact_info -> ''address'' ->> ''addressLine1'' AS student_address_line_1,
                student.contact_info -> ''address'' ->> ''city'' AS student_city,
                COALESCE(
                    student.contact_info -> ''address'' ->> ''provinceState'',
                    ''''
                ) AS student_province,
                student.contact_info -> ''address'' ->> ''postalCode'' AS student_postal_code,
                student.contact_info -> ''address'' ->> ''country'' AS student_country,
                cas_supplier.supplier_number AS cas_supplier,
                cas_supplier.supplier_protected AS cas_supplier_protected,
                cas_supplier.supplier_address ->> ''supplierSiteCode'' AS cas_site,
                cas_supplier.supplier_address ->> ''siteProtected'' AS cas_site_protected,
                cas_supplier.supplier_status_updated_on AS cas_supplier_verified_date,
                COALESCE(
                    cas_supplier.student_profile_snapshot ->> ''firstName'',
                    ''''
                ) AS cas_snapshot_first_name,
                COALESCE(
                    cas_supplier.student_profile_snapshot ->> ''lastName'',
                    ''''
                ) AS cas_snapshot_last_name,
                COALESCE(
                    cas_supplier.student_profile_snapshot ->> ''sin'',
                    ''''
                ) AS cas_snapshot_sin,
                COALESCE(
                    cas_supplier.student_profile_snapshot ->> ''addressLine1'',
                    ''''
                ) AS cas_snapshot_address_line_1,
                COALESCE(
                    cas_supplier.student_profile_snapshot ->> ''city'',
                    ''''
                ) AS cas_snapshot_city,
                COALESCE(
                    cas_supplier.student_profile_snapshot ->> ''province'',
                    ''''
                ) AS cas_snapshot_province,
                COALESCE(
                    cas_supplier.student_profile_snapshot ->> ''postalCode'',
                    ''''
                ) AS cas_snapshot_postal_code,
                COALESCE(
                    cas_supplier.student_profile_snapshot ->> ''country'',
                    ''''
                ) AS cas_snapshot_country
            FROM
                sims.students student
                INNER JOIN sims.cas_suppliers cas_supplier on student.cas_supplier_id = cas_supplier.id
                INNER JOIN sims.users student_user on student.user_id = student_user.id
                INNER JOIN sims.sin_validations sin_validation on student.sin_validation_id = sin_validation.id
            WHERE
                cas_supplier.is_valid = true
                AND (
                    jsonb_build_object(
                        ''firstName'',
                        student_user.first_name,
                        ''lastName'',
                        student_user.last_name,
                        ''sin'',
                        sin_validation.sin,
                        ''addressLine1'',
                        student.contact_info -> ''address'' ->> ''addressLine1'',
                        ''city'',
                        student.contact_info -> ''address'' ->> ''city'',
                        ''province'',
                        student.contact_info -> ''address'' ->> ''provinceState'',
                        ''postalCode'',
                        student.contact_info -> ''address'' ->> ''postalCode'',
                        ''country'',
                        student.contact_info -> ''address'' ->> ''country''
                    ) :: text NOT ILIKE jsonb_build_object(
                        ''firstName'',
                        cas_supplier.student_profile_snapshot ->> ''firstName'',
                        ''lastName'',
                        cas_supplier.student_profile_snapshot ->> ''lastName'',
                        ''sin'',
                        cas_supplier.student_profile_snapshot ->> ''sin'',
                        ''addressLine1'',
                        cas_supplier.student_profile_snapshot ->> ''addressLine1'',
                        ''city'',
                        cas_supplier.student_profile_snapshot ->> ''city'',
                        ''province'',
                        cas_supplier.student_profile_snapshot ->> ''province'',
                        ''postalCode'',
                        cas_supplier.student_profile_snapshot ->> ''postalCode'',
                        ''country'',
                        cas_supplier.student_profile_snapshot ->> ''country''
                    ) :: text
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
                (cas_supplier_report.student_updated_date AT TIME ZONE ''America/Vancouver''),
                ''YYYY-MM-DD''
            ) AS "Student Updated Date",
            cas_supplier_report.cas_supplier AS "Supplier",
            cas_supplier_report.cas_site AS "Site",
            cas_supplier_report.cas_supplier_protected AS "Protected Supplier",
            cas_supplier_report.cas_site_protected AS "Protected Site",
            TO_CHAR(
                (cas_supplier_report.cas_supplier_verified_date AT TIME ZONE ''America/Vancouver''),
                ''YYYY-MM-DD''
            ) AS "Supplier Verified Date",
            cas_supplier_report.student_first_name NOT ILIKE cas_supplier_report.cas_snapshot_first_name AS "First Name Updated",
            cas_supplier_report.student_last_name NOT ILIKE cas_supplier_report.cas_snapshot_last_name AS "Last Name Updated",
            cas_supplier_report.student_sin NOT ILIKE cas_supplier_report.cas_snapshot_sin AS "SIN Updated",
            cas_supplier_report.student_address_line_1 NOT ILIKE cas_supplier_report.cas_snapshot_address_line_1 AS "Address Line 1 Updated",
            cas_supplier_report.student_city NOT ILIKE cas_supplier_report.cas_snapshot_city AS "City Updated",
            cas_supplier_report.student_province NOT ILIKE cas_supplier_report.cas_snapshot_province AS "Province Updated",
            cas_supplier_report.student_postal_code NOT ILIKE cas_supplier_report.cas_snapshot_postal_code AS "Postal Code Updated",
            cas_supplier_report.student_country NOT ILIKE cas_supplier_report.cas_snapshot_country AS "Country Updated"
        FROM
            cas_supplier_report
        ORDER BY
            student_updated_date;'
    );