ALTER TABLE
  sims.application_exception_requests
ADD
  -- Keeping the default to 0 to avoid nulls and simplify uniqueness enforcement.
  COLUMN exception_index SMALLINT DEFAULT 0,
ADD
  COLUMN exception_description VARCHAR(500) NOT NULL DEFAULT '',
ADD
  COLUMN approval_exception_request_id INT REFERENCES sims.application_exception_requests(id),
ADD
  COLUMN exception_hash CHAR(64);

COMMENT ON COLUMN sims.application_exception_requests.exception_index IS 'Index used for exceptions that can happen multiple times, for instance, dependents list or parents list.';

COMMENT ON COLUMN sims.application_exception_requests.exception_description IS 'Description of the application exception. Critical for exceptions that happen multiple times to allow its individual identification.';

COMMENT ON COLUMN sims.application_exception_requests.approval_exception_request_id IS 'Reference to a previously approved exception request that was considered to have the same content, which includes also associated files.';

COMMENT ON COLUMN sims.application_exception_requests.exception_hash IS 'Hash of the application exception data, which also include files names and content hashes.';

-- Create unique index on application_exception_id, exception_name, and exception_index.
CREATE UNIQUE INDEX application_exception_id_exception_name_exception_index_unique ON sims.application_exception_requests (
  application_exception_id,
  exception_name,
  exception_index
);

-- No need to drop the index in the rollback as the columns will be dropped and the index will be removed automatically.
COMMENT ON INDEX sims.application_exception_id_exception_name_exception_index_unique IS 'Ensures that for a given application exception request, the combination of exception name and index is unique. This prevents duplicate entries for the same exception type within a single application exception request.';

-- Update exception_description based on existing exception_name values
UPDATE
  sims.application_exception_requests
SET
  exception_description = CASE
    exception_name
    WHEN 'citizenshipForPermanentResidencyApplicationException' THEN 'Citizenship for permanent residency'
    WHEN 'citizenshipForProtectedPersonsApplicationException' THEN 'Citizenship for protected persons'
    WHEN 'citizenshipForBCResidencyApplicationException' THEN 'Citizenship for B.C. residency'
    WHEN 'dependantsIncomeTaxApplicationException' THEN 'Dependant''s income tax'
    WHEN 'dependantsSharedCustodyApplicationException' THEN 'Dependant''s shared custody'
    WHEN 'estrangedFromParentsApplicationException' THEN 'Modified Independent'
    WHEN 'parentsResidencyApplicationException' THEN 'Parent residency'
    WHEN 'exceptionalExpensesApplicationException' THEN 'Exceptional expenses'
    WHEN 'rentLivingSituationApplicationException' THEN 'Rent living situation'
    WHEN 'transportationApplicationException' THEN 'Transportation'
    WHEN 'studyEndDateIsPastApplicationException' THEN 'Study end date is past'
    WHEN 'currentYearIncomeApplicationException' THEN 'Current Year Income'
    WHEN 'currentYearPartnerIncomeApplicationException' THEN 'Partner current year income'
    WHEN 'currentYearParentIncomeApplicationException' THEN 'Parent current year income'
    WHEN 'marriedCommonLawDomesticViolenceApplicationException' THEN 'Married/common-law domestic violence'
    ELSE 'Unknown exception'
  END;

-- Remove the previously added default value for exception_description.
ALTER TABLE
  sims.application_exception_requests
ALTER COLUMN
  exception_description DROP DEFAULT;