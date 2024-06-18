INSERT INTO
  sims.report_configs (report_name, report_sql)
VALUES
  (
    'Program_And_Offering_Status_Report',
    'with offerings_dataset as (
      select
        institution_locations.name as "Institution Location Name",
        education_programs.id as "program_id",
        education_programs.program_name as "Program Name",
        education_programs.sabc_code as "SABC Program Code",
        education_programs.regulatory_body as "Regulatory Body",
        education_programs.credential_type as "Credential Type",
        education_programs.completion_years as "Program Length",
        case
          when (
            education_programs.delivered_on_site = true
            and education_programs.delivered_online = true
          ) then ''Blended''
          when education_programs.delivered_on_site = true then ''On-site''
          when education_programs.delivered_online = true then ''Online''
        end as "Delivery",
        education_programs.course_load_calculation as "Credit or Hours",
        education_programs.program_status as "Program Status",
        case
          when education_programs.is_active = true then false
          when education_programs.is_active = false then true
        end as "Program Deactivated?",
        education_programs.effective_end_date as "Program Expiry Date",
        education_programs_offerings.offering_name as "Offering Name",
        cast(
          education_programs_offerings.study_start_date as varchar
        ) as "Study Start Date",
        cast(
          education_programs_offerings.study_end_date as varchar
        ) as "Study End Date",
        education_programs_offerings.year_of_study as "Year of Study",
        education_programs_offerings.offering_type as "Offering Type",
        education_programs_offerings.offering_status as "Offering Status",
        education_programs_offerings.offering_intensity as "Offering Intensity"
      from
        sims.education_programs education_programs
        left join sims.education_programs_offerings education_programs_offerings on education_programs.id = education_programs_offerings.program_id
        inner join sims.institution_locations institution_locations on education_programs_offerings.location_id = institution_locations.id
        inner join sims.institutions institutions on institution_locations.institution_id = institutions.id
      where
        institutions.id = :institution
        and (
          education_programs_offerings.study_start_date between :startDate
          and :endDate
        )
        and education_programs_offerings.offering_intensity = any(:offeringIntensity)
        and (
          :sabcProgramCode = ''''
          or education_programs.sabc_code = :sabcProgramCode
        )
        and education_programs.program_status in (''Approved'', ''Pending'')
        and (
          education_programs.is_active = true
          or (
            education_programs.is_active = false
            and education_programs.is_active_updated_on >= :startDate
          )
        )
        and (
          education_programs.effective_end_date is null
          or education_programs.effective_end_date >= :startDate
        )
        and case
          when array [''Part Time''] :: sims.offering_intensity [] = :offeringIntensity :: sims.offering_intensity [] then education_programs.program_intensity = ''Full Time and Part Time''
          when array [''Full Time''] :: sims.offering_intensity [] = :offeringIntensity :: sims.offering_intensity [] then education_programs.program_intensity = ''Full Time''
          else education_programs.program_intensity in (''Full Time'', ''Full Time and Part Time'')
        end
    )
    select
      "Institution Location Name",
      "Program Name",
      "SABC Program Code",
      "Regulatory Body",
      "Credential Type",
      "Program Length",
      "Delivery",
      "Credit or Hours",
      "Program Status",
      "Program Deactivated?",
      "Program Expiry Date",
      "Offering Name",
      "Study Start Date",
      "Study End Date",
      "Year of Study",
      "Offering Type",
      "Offering Status",
      "Offering Intensity"
    from
      offerings_dataset
    union
    all
    select
      institution_locations.name as "Institution Location Name",
      education_programs.program_name as "Program Name",
      education_programs.sabc_code as "SABC Program Code",
      education_programs.regulatory_body as "Regulatory Body",
      education_programs.credential_type as "Credential Type",
      education_programs.completion_years as "Program Length",
      case
        when (
          education_programs.delivered_on_site = true
          and education_programs.delivered_online = true
        ) then ''Blended''
        when education_programs.delivered_on_site = true then ''On-site''
        when education_programs.delivered_online = true then ''Online''
      end as "Delivery",
      education_programs.course_load_calculation as "Credit or Hours",
      education_programs.program_status as "Program Status",
      case
        when education_programs.is_active = true then false
        when education_programs.is_active = false then true
      end as "Program Deactivated?",
      education_programs.effective_end_date as "Program Expiry Date",
      null as "Offering Name",
      null as "Study Start Date",
      null as "Study End Date",
      null as "Year of Study",
      null as "Offering Type",
      null as "Offering Status",
      null as "Offering Intensity"
    from
      sims.education_programs education_programs
      inner join sims.institutions institutions on education_programs.institution_id = institutions.id
      inner join sims.institution_locations institution_locations on institution_locations.institution_id = institutions.id
    where
      institutions.id = :institution
      and (
        :sabcProgramCode = ''''
        or education_programs.sabc_code = :sabcProgramCode
      )
      and education_programs.program_status in (''Approved'', ''Pending'')
      and (
        education_programs.is_active = true
        or (
          education_programs.is_active = false
          and education_programs.is_active_updated_on >= :startDate
        )
      )
      and (
        education_programs.effective_end_date is null
        or education_programs.effective_end_date >= :startDate
      )
      and case
        when array [''Part Time''] :: sims.offering_intensity [] = :offeringIntensity :: sims.offering_intensity [] then education_programs.program_intensity = ''Full Time and Part Time''
        when array [''Full Time''] :: sims.offering_intensity [] = :offeringIntensity :: sims.offering_intensity [] then education_programs.program_intensity = ''Full Time''
        else education_programs.program_intensity in (''Full Time'', ''Full Time and Part Time'')
      end
      and education_programs.id not in (
        select
          "program_id"
        from
          offerings_dataset
      )
    order by
      "Institution Location Name",
      "Program Name",
      "Offering Name",
      "Offering Intensity";'
  );