ALTER TABLE
    sims.sfas_applications
ADD
    COLUMN application_number INT,
ADD
    COLUMN living_arrangements CHAR(1),
ADD
    COLUMN marital_status VARCHAR(4),
ADD
    COLUMN marriage_date DATE,
ADD
    COLUMN bc_residency_flag CHAR(1),
ADD
    COLUMN permanent_residency_flag CHAR(1),
ADD
    COLUMN gross_income_previous_year INT,
ADD
    COLUMN institution_code CHAR(4),
ADD
    COLUMN application_status_code CHAR(4),
ADD
    COLUMN education_period_weeks INT,
ADD
    COLUMN course_load INT,
ADD
    COLUMN assessed_costs_living_allowance NUMERIC(8, 2),
ADD
    COLUMN assessed_costs_extra_shelter NUMERIC(8, 2),
ADD
    COLUMN assessed_costs_child_care NUMERIC(8, 2),
ADD
    COLUMN assessed_costs_alimony NUMERIC(8, 2),
ADD
    COLUMN assessed_costs_local_transport NUMERIC(8, 2),
ADD
    COLUMN assessed_costs_return_transport NUMERIC(8, 2),
ADD
    COLUMN assessed_costs_tuition NUMERIC(8, 2),
ADD
    COLUMN assessed_costs_books_and_supplies NUMERIC(8, 2),
ADD
    COLUMN assessed_costs_exceptional_expenses NUMERIC(8, 2),
ADD
    COLUMN assessed_costs_other NUMERIC(8, 2),
ADD
    COLUMN assessed_costs_discretionary_expenses NUMERIC(8, 2),
ADD
    COLUMN withdrawal_date DATE,
ADD
    COLUMN withdrawal_reason CHAR(4),
ADD
    COLUMN withdrawal_active_flag CHAR(1);

COMMENT ON COLUMN sims.sfas_applications.application_number IS 'The unique application number assigned to this application (Application_alias.application_no).';

COMMENT ON COLUMN sims.sfas_applications.living_arrangements IS '(Spouse/dependents/parents)|To verify information provided to SDPR for the purpose of determining or auditing eligibility (application.study_period_living_at_home_flg).';

COMMENT ON COLUMN sims.sfas_applications.address_line_2 IS 'Line 2 of the applicant''s address (address_current_view_unique.address_2).';

COMMENT ON COLUMN sims.sfas_applications.city IS 'City name the applicant''s address (address_current_view_unique.city).';

COMMENT ON COLUMN sims.sfas_applications.province_state IS 'Province or State Code - only exists if in Canada or US (address_current_view_unique.prov_cde).';

COMMENT ON COLUMN sims.sfas_applications.country IS 'Country Code (address_current_view_unique.country_cde).';

COMMENT ON COLUMN sims.sfas_applications.phone_number IS 'Phone number of the applicant (address_current_view_unique.phone_num).';

COMMENT ON COLUMN sims.sfas_applications.postal_zip_code IS 'Applicant''s Postal (in Canada) or Zip code (USA), otherwise blank (address_current_view_unique.postal_or_zip_code).';

COMMENT ON COLUMN sims.sfas_applications.lmpt_award_amount IS 'Total Labour Market Tools Grant (Individual_award.award_dlr where award_code = ''LMPT'').';

COMMENT ON COLUMN sims.sfas_applications.lmpu_award_amount IS 'Total Labour Market Unmet Need Grant (Individual_award.award_dlr where award_code = ''LMPU'').';

COMMENT ON COLUMN sims.sfas_applications.initials IS 'Initials of applicant (individual_alias_current_view.initials).';

COMMENT ON COLUMN sims.sfas_applications.address_line_1 IS 'Line 1 of the applicant''s address (address_current_view_unique.address_1).';

COMMENT ON COLUMN sims.sfas_applications.address_line_2 IS 'Line 2 of the applicant''s address (address_current_view_unique.address_2).';

COMMENT ON COLUMN sims.sfas_applications.city IS 'City name the applicant''s address (address_current_view_unique.city).';

COMMENT ON COLUMN sims.sfas_applications.province_state IS 'Province or State Code - only exists if in Canada or US (address_current_view_unique.prov_cde).';

COMMENT ON COLUMN sims.sfas_applications.country IS 'Country Code (address_current_view_unique.country_cde).';

COMMENT ON COLUMN sims.sfas_applications.phone_number IS 'Phone number of the applicant (address_current_view_unique.phone_num).';

COMMENT ON COLUMN sims.sfas_applications.postal_zip_code IS 'Applicant''s Postal (in Canada) or Zip code (USA), otherwise blank (address_current_view_unique.postal_or_zip_code).';

COMMENT ON COLUMN sims.sfas_applications.lmpt_award_amount IS 'Total Labour Market Tools Grant (Individual_award.award_dlr where award_code = ''LMPT'').';

COMMENT ON COLUMN sims.sfas_applications.lmpu_award_amount IS 'Total Labour Market Unmet Need Grant (Individual_award.award_dlr where award_code = ''LMPU'').';

COMMENT ON COLUMN sims.sfas_applications.country IS 'Country Code (address_current_view_unique.country_cde).';

COMMENT ON COLUMN sims.sfas_applications.phone_number IS 'Phone number of the applicant (address_current_view_unique.phone_num).';

COMMENT ON COLUMN sims.sfas_applications.postal_zip_code IS 'Applicant''s Postal (in Canada) or Zip code (USA), otherwise blank (address_current_view_unique.postal_or_zip_code).';

COMMENT ON COLUMN sims.sfas_applications.lmpt_award_amount IS 'Total Labour Market Tools Grant (Individual_award.award_dlr where award_code = ''LMPT'').';

COMMENT ON COLUMN sims.sfas_applications.lmpu_award_amount IS 'Total Labour Market Unmet Need Grant (Individual_award.award_dlr where award_code = ''LMPU'').';