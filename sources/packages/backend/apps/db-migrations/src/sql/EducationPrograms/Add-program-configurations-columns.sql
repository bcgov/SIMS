ALTER TABLE
  sims.education_programs
ADD
  COLUMN program_data JSONB,
ADD
  COLUMN program_configuration_id INT REFERENCES sims.education_programs_configurations(id);

ALTER TABLE
  sims.education_programs_history
ADD
  COLUMN program_data JSONB,
ADD
  COLUMN program_configuration_id INT;

-- Backfill program_data with every existing column not already represented by
-- a dedicated, non-dynamic education_programs column (id, descriptive/status/
-- institution/audit/workflow columns, and the is_active tracking columns).
UPDATE
  sims.education_programs
SET
  program_data = jsonb_build_object(
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
    'deliveredOnSite',
    delivered_on_site,
    'deliveredOnline',
    delivered_online,
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
    'hasMinimumAge',
    has_minimum_age,
    'minHighSchool',
    min_high_school,
    'requirementsByInstitution',
    requirements_by_institution,
    'requirementsByBcita',
    requirements_by_bcita,
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
    'noneOfEntranceRequirements',
    none_of_entrance_requirements,
    'credentialTypesAviation',
    credential_types_aviation
  );