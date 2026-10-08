-- Add new columns to the education_programs.
-- The new columns will be set as NOT NULL after backfilling.
ALTER TABLE sims.education_programs
ADD COLUMN program_data JSONB,
ADD COLUMN program_configuration_id INT REFERENCES sims.education_programs_configurations (id);

COMMENT ON COLUMN sims.education_programs.program_data IS 'Education program data, validated against the validation schema of the program configuration.';

COMMENT ON COLUMN sims.education_programs.program_configuration_id IS 'Program configuration used to render and validate the program data.';

-- Add new columns to the history table.
ALTER TABLE sims.education_programs_history
ADD COLUMN program_data JSONB,
ADD COLUMN program_configuration_id INT;

COMMENT ON COLUMN sims.education_programs_history.program_data IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.program_configuration_id IS 'Historical data from the original table. See original table comments for details.';

-- Backfill program_data with every existing program that are not system related.
UPDATE sims.education_programs
SET
  program_data = JSONB_STRIP_NULLS(
    JSONB_BUILD_OBJECT(
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
      JSONB_BUILD_OBJECT(
        'onSite',
        COALESCE(delivered_on_site, FALSE),
        'online',
        COALESCE(delivered_online, FALSE)
      ),
      'deliveredOnlineAlsoOnSite',
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
      'hasWILComponent',
      has_wil_component,
      'isWILApproved',
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
    )
  );

-- Associate all the existing education programs with the most recent program configuration.
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

-- Set the new columns as NOT NULL.
ALTER TABLE sims.education_programs
ALTER COLUMN program_data
SET NOT NULL,
ALTER COLUMN program_configuration_id
SET NOT NULL;