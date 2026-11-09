INSERT INTO
  sims.report_configs (report_name, report_sql)
VALUES
  (
    'Ministry_Restriction_Categories_Report',
    $$
    WITH active_restrictions AS (
      SELECT
        student_restrictions.restriction_id
      FROM
        sims.student_restrictions student_restrictions
      WHERE
        student_restrictions.is_active = TRUE
        AND student_restrictions.deleted_at IS NULL
      UNION
      ALL
      SELECT
        institution_restrictions.restriction_id
      FROM
        sims.institution_restrictions institution_restrictions
      WHERE
        institution_restrictions.is_active = TRUE
    ),
    active_restriction_counts AS (
      SELECT
        active_restrictions.restriction_id,
        COUNT(*) AS active_count
      FROM
        active_restrictions
      GROUP BY
        active_restrictions.restriction_id
    )
    SELECT
      restrictions.restriction_code AS "Code",
      restrictions.description AS "Description",
      restrictions.restriction_type AS "Restriction Type",
      restrictions.restriction_category AS "Category",
      array_to_string(restrictions.action_type, ', ') AS "Action Type",
      restrictions.notification_type AS "Notification Type",
      COALESCE(active_restriction_counts.active_count, 0) AS "Active Count"
    FROM
      sims.restrictions restrictions
      LEFT JOIN active_restriction_counts ON active_restriction_counts.restriction_id = restrictions.id
    ORDER BY
      restrictions.restriction_code ASC,
      restrictions.id ASC $$
  );