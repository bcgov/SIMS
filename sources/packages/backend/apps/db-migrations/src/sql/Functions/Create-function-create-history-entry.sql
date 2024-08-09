-- Generic function to be associated with table triggers to allow historical records creation.
CREATE FUNCTION sims.create_history_entry() RETURNS trigger
    LANGUAGE plpgsql
AS
$func$
DECLARE
    history_table_name text := TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME || '_history';
BEGIN
    EXECUTE 'INSERT INTO ' || history_table_name || ' SELECT CURRENT_TIMESTAMP, $1, ($2).*;' using TG_OP, NEW;
    RETURN NULL;
END;
$func$;

COMMENT ON FUNCTION sims.create_history_entry() IS 'Generic function to create modification history for required tables.';
