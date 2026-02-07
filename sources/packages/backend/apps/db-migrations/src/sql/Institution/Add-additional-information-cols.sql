ALTER TABLE
    sims.institutions
ADD
    COLUMN country CHAR(2) CHECK (
        sims.is_valid_system_lookup_key(country :: TEXT, 'Country' :: TEXT)
    ),
ADD
    COLUMN province CHAR(2) CHECK (
        sims.is_valid_system_lookup_key(province :: TEXT, 'Province' :: TEXT)
    ),
ADD
    COLUMN classification VARCHAR(50),
ADD
    COLUMN organization_status VARCHAR(50),
ADD
    COLUMN medical_school_status VARCHAR(50);

COMMENT ON COLUMN sims.institutions.country IS 'Country code of the institution country.';

COMMENT ON COLUMN sims.institutions.province IS 'Province code of the institution province if the country is Canada.';

COMMENT ON COLUMN sims.institutions.classification IS 'Classification of the institution (e.g. public or private).';

COMMENT ON COLUMN sims.institutions.organization_status IS 'Organization status of the institution (e.g. profit or non-profit).';

COMMENT ON COLUMN sims.institutions.medical_school_status IS 'Indicates the status of the institution being considered as a medical school.';

-- Add columns to history table.
ALTER TABLE
    sims.institutions_history
ADD
    COLUMN country CHAR(2),
ADD
    COLUMN province CHAR(2),
ADD
    COLUMN classification VARCHAR(50),
ADD
    COLUMN organization_status VARCHAR(50),
ADD
    COLUMN medical_school_status VARCHAR(50);

COMMENT ON COLUMN sims.institutions_history.country IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institutions_history.province IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institutions_history.classification IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institutions_history.organization_status IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.institutions_history.medical_school_status IS 'Historical data from the original table. See original table comments for details.';

-- Update the applicable new columns based on the institution type.
UPDATE
    sims.institutions
SET
    country = CASE
        -- Update for Canadian institution types(BC Public, BC Private, Out of Province Public, Out of Province Private) to CA.
        -- Update for United States institution type to US.
        WHEN institution_type_id IN (1, 2, 3, 7) THEN 'CA'
        WHEN institution_type_id = 4 THEN 'US'
        ELSE NULL
    END,
    province = CASE
        -- Update for Canadian BC institution types(BC Public, BC Private) to BC.
        WHEN institution_type_id IN (1, 2) THEN 'BC'
        ELSE NULL
    END,
    classification = CASE
        -- Update for Canadian public institution types(BC Public, Out of Province Public) to public.
        -- Update for Canadian private institution types(BC Private, Out of Province Private) to private.
        WHEN institution_type_id IN (1, 3) THEN 'public'
        WHEN institution_type_id IN (2, 7) THEN 'private'
        ELSE NULL
    END,
    medical_school_status = CASE
        -- Update for International Medical institution type to yes.
        -- Update for International institution type to no.
        WHEN institution_type_id = 6 THEN 'yes'
        WHEN institution_type_id = 5 THEN 'no'
        ELSE NULL
    END,
    updated_at = NOW(),
    modifier = (
        SELECT
            id
        FROM
            sims.users
        WHERE
            -- System user.
            user_name = '8fb44f70-6ce6-11ed-b307-8743a2da47ef@system'
    );