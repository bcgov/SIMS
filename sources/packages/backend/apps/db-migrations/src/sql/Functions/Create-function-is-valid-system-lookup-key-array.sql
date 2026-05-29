CREATE FUNCTION sims.is_valid_system_lookup_key_array(
    input_keys TEXT[],
    input_category TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    valid_count INTEGER;
BEGIN
    IF input_keys IS NULL THEN
        RETURN FALSE;
    END IF;
    SELECT COUNT(DISTINCT lookup_key)INTO valid_count
    FROM
        sims.system_lookup_configurations
    WHERE
        lookup_category = input_category
        AND lookup_key = ANY(input_keys);
    RETURN valid_count = array_length(input_keys, 1);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION sims.is_valid_system_lookup_key_array(TEXT[], TEXT) IS 'Returns TRUE if all input_keys exist as lookup_key for the given category in system_lookup_configurations.';