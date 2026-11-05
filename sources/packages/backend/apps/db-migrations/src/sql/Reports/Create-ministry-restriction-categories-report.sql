INSERT INTO
  sims.report_configs (report_name, report_sql)
VALUES
  (
    'Ministry_Restriction_Categories_Report',
    $$
    SELECT
      restrictions.restriction_code AS "Code",
      restrictions.description AS "Description",
      restrictions.restriction_type AS "Restriction Type",
      restrictions.restriction_category AS "Category",
      array_to_string(restrictions.action_type, ', ') AS "Action Type",
      restrictions.notification_type AS "Notification Type",
      (
        SELECT
          COUNT(*)
        FROM
          sims.student_restrictions student_restrictions
        WHERE
          student_restrictions.restriction_id = restrictions.id
          AND student_restrictions.is_active = TRUE
          AND student_restrictions.deleted_at IS NULL
      ) + (
        SELECT
          COUNT(*)
        FROM
          sims.institution_restrictions institution_restrictions
        WHERE
          institution_restrictions.restriction_id = restrictions.id
          AND institution_restrictions.is_active = TRUE
      ) AS "Active Count"
    FROM
      sims.restrictions restrictions
    ORDER BY
      restrictions.restriction_code ASC,
      restrictions.id ASC $$
  );
