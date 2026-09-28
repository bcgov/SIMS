ALTER TABLE sims.education_programs
ADD COLUMN program_data JSONB,
ADD COLUMN program_configuration_id INT REFERENCES sims.education_programs_configurations (id);

ALTER TABLE sims.education_programs_history
ADD COLUMN program_data JSONB,
ADD COLUMN program_configuration_id INT;

-- Backfill program_data with every existing program form columns.
-- Null columns are stripped, leaving the property absent (as a not filled
-- optional form field would be) instead of null, which would fail the
-- "type" validation of optional fields like sabcCode.
UPDATE sims.education_programs
SET
  program_data = JSONB_STRIP_NULLS(JSONB_BUILD_OBJECT(
    'programName',
    program_name,
    'programDescription',
    program_description,
    'credentialType',
    credential_type,
    'cipCode',
    cip_code,
    'nocCode',
    noc_code,
    'sabcCode',
    sabc_code,
    'regulatoryBody',
    regulatory_body,
    'programDeliveryTypes',
    TO_JSONB(
      ARRAY_REMOVE(
        ARRAY[
          CASE
            WHEN delivered_on_site THEN 'deliveredOnSite'
          END,
          CASE
            WHEN delivered_online THEN 'deliveredOnline'
          END
        ],
        NULL
      )
    ),
    'deliveredOnlineAlsoOnsite',
    delivered_online_also_onsite,
    'sameOnlineCreditsEarned',
    same_online_credits_earned,
    'earnAcademicCreditsOtherInstitution',
    earn_academic_credits_other_institution,
    'courseLoadCalculation',
    course_load_calculation,
    'completionYears',
    completion_years,
    'eslEligibility',
    esl_eligibility,
    'hasJointInstitution',
    has_joint_institution,
    'hasJointDesignatedInstitution',
    has_joint_designated_institution,
    'programIntensity',
    program_intensity,
    'institutionProgramCode',
    institution_program_code,
    'minHoursWeek',
    min_hours_week,
    'isAviationProgram',
    is_aviation_program,
    'minHoursWeekAvi',
    min_hours_week_avi,
    'entranceRequirements',
    JSONB_BUILD_OBJECT(
      'hasMinimumAge',
      COALESCE(has_minimum_age, FALSE),
      'minHighSchool',
      COALESCE(min_high_school, FALSE),
      'requirementsByInstitution',
      COALESCE(requirements_by_institution, FALSE),
      'requirementsByBCITA',
      COALESCE(requirements_by_bcita, FALSE),
      'none',
      COALESCE(none_of_entrance_requirements, FALSE)
    ),
    'hasWilComponent',
    has_wil_component,
    'isWilApproved',
    is_wil_approved,
    'wilProgramEligibility',
    wil_program_eligibility,
    'hasTravel',
    has_travel,
    'travelProgramEligibility',
    travel_program_eligibility,
    'hasIntlExchange',
    has_intl_exchange,
    'intlExchangeProgramEligibility',
    intl_exchange_program_eligibility,
    'programDeclaration',
    program_declaration,
    'fieldOfStudyCode',
    field_of_study_code,
    'otherRegulatoryBody',
    other_regulatory_body,
    'credentialTypesAviation',
    credential_types_aviation
  ));

UPDATE sims.education_programs
SET
  program_configuration_id = (
    SELECT
      education_programs_configurations.id
    FROM
      sims.education_programs_configurations education_programs_configurations
      JOIN sims.program_years program_years ON program_years.id = education_programs_configurations.program_year_id
    ORDER BY
      program_years.start_date DESC
    LIMIT
      1
  );

ALTER TABLE sims.education_programs
ALTER COLUMN program_data
SET NOT NULL,
ALTER COLUMN program_configuration_id
SET NOT NULL;