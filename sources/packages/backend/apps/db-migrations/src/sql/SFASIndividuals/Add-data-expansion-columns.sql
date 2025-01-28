ALTER TABLE
    sims.sfas_individuals
ADD
    COLUMN initials VARCHAR(3),
ADD
    COLUMN address_line_1 VARCHAR(40),
ADD
    COLUMN address_line_2 VARCHAR(40),
ADD
    COLUMN city VARCHAR(25),
ADD
    COLUMN province_state VARCHAR(4),
ADD
    COLUMN country VARCHAR(4),
ADD
    COLUMN phone_number INT,
ADD
    COLUMN postal_zip_code VARCHAR(7),
ADD
    COLUMN lmpt_award_amount NUMERIC(8, 2),
ADD
    COLUMN lmpu_award_amount NUMERIC(8, 2);

COMMENT ON COLUMN sims.sfas_individuals.initials IS 'Initials of applicant (individual_alias_current_view.initials).';

COMMENT ON COLUMN sims.sfas_individuals.address_line_1 IS 'Line 1 of the applicant''s address (address_current_view_unique.address_1).';

COMMENT ON COLUMN sims.sfas_individuals.address_line_2 IS 'Line 2 of the applicant''s address (address_current_view_unique.address_2).';

COMMENT ON COLUMN sims.sfas_individuals.city IS 'City name the applicant''s address (address_current_view_unique.city).';

COMMENT ON COLUMN sims.sfas_individuals.province_state IS 'Province or state code - only exists if in Canada or US (address_current_view_unique.prov_cde).';

COMMENT ON COLUMN sims.sfas_individuals.country IS 'Country code (address_current_view_unique.country_cde).';

COMMENT ON COLUMN sims.sfas_individuals.phone_number IS 'Phone number of the applicant (address_current_view_unique.phone_num).';

COMMENT ON COLUMN sims.sfas_individuals.postal_zip_code IS 'Applicant''s postal (in Canada) or zip code (USA), otherwise blank (address_current_view_unique.postal_or_zip_code).';

COMMENT ON COLUMN sims.sfas_individuals.lmpt_award_amount IS 'Total labour market tools grant (Individual_award.award_dlr where award_code = ''LMPT'').';

COMMENT ON COLUMN sims.sfas_individuals.lmpu_award_amount IS 'Total labour market unmet need grant (Individual_award.award_dlr where award_code = ''LMPU'').';