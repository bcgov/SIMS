CREATE FUNCTION sims.is_valid_system_lookup_key(
    input_key TEXT,
    input_category TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Explicitly check for NULL first to avoid further table scanning.
    IF input_key IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Return the result of the existence check.
    RETURN EXISTS (
        SELECT 1 
        FROM sims.system_lookup_configurations 
        WHERE lookup_category = input_category 
          AND lookup_key = input_key
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION sims.is_valid_system_lookup_key(TEXT,TEXT) IS 'Function to check if the provided key for the category is valid in system lookup.';