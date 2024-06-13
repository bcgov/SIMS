INSERT INTO
  sims.report_configs (report_name, report_sql)
VALUES
  (
    'Program_And_Offering_Status_Report',
    '(
        select 
          il.name as "Institution Location Name",
          ep.program_name as "Program Name",
          ep.sabc_code as "SABC Program Code",
          ep.regulatory_body as "Regulatory Body",
          ep.credential_type as "Credential Type",
          ep.completion_years as "Program Length",
          case
            when (ep.delivered_on_site = true and ep.delivered_online = true) then ''Blended''
            when ep.delivered_on_site = true then ''On-site''
            when ep.delivered_online = true then ''Online''
          end as "Delivery",
          ep.course_load_calculation as "Credit or Hours",
          ep.program_status as "Program Status",
          case 
            when ep.is_active = false then ''True''
            when ep.is_active = true then ''False''
          end as "Program Deactivated?",
          ep.effective_end_date as "Program Expiry Date",
          epo.offering_name as "Offering Name", 
          to_char(
            epo.study_start_date,
           ''YYYY-MM-DD''
          ) as "Study Start Date",
          to_char(
            epo.study_end_date,
           ''YYYY-MM-DD''
          ) as "Study End Date",
          epo.year_of_study as "Year of Study",
          epo.offering_type as "Offering Type",
          epo.offering_status as "Offering Status",
          epo.offering_intensity as "Offering Intensity"
        from 
          sims.education_programs_offerings epo 
          inner join sims.institution_locations il on il.id = epo.location_id
          inner join sims.institutions i on i.id = il.institution_id
          inner join sims.education_programs ep on ep.id = epo.program_id
        where
          i.id = :institution
          and epo.study_start_date between :startDate and :endDate
          and epo.offering_status in (''Approved'', ''Creation pending'')
          and epo.offering_intensity = any(:offeringIntensity)
          and
            case 
              when :sabcProgramCode = '''' then (ep.sabc_code is null or ep.sabc_code is not null)
              when :sabcProgramCode != '''' then ep.sabc_code = :sabcProgramCode
            end
          and ep.program_status in (''Approved'', ''Pending'')
          and (ep.is_active = true or ep.is_active_updated_on >= :startDate)
          and (ep.effective_end_date is null or ep.effective_end_date >= :startDate)
          and 
            case
              when array[''Part Time''] :: sims.offering_intensity [] = :offeringIntensity :: sims.offering_intensity [] 
              then ep.program_intensity = ''Full Time and Part Time''
              when array[''Full Time''] :: sims.offering_intensity [] = :offeringIntensity :: sims.offering_intensity [] 
              then ep.program_intensity = ''Full Time''
              else ep.program_intensity in (''Full Time'', ''Full Time and Part Time'')
            end
        union
        select 
          il.name as "Institution Location Name",
          ep.program_name as "Program Name",
          ep.sabc_code as "SABC Program Code",
          ep.regulatory_body as "Regulatory Body",
          ep.credential_type as "Credential Type",
          ep.completion_years as "Program Length",
          case
            when (ep.delivered_on_site = true and ep.delivered_online = true) then ''Blended''
            when ep.delivered_on_site = true then ''On-site''
            when ep.delivered_online = true then ''Online''
          end as "Delivery",
          ep.course_load_calculation as "Credit or Hours",
          ep.program_status as "Program Status",
          case 
            when ep.is_active = true then ''False''
          end as "Program Deactivated?",
          ep.effective_end_date as "Program Expiry Date",
          null as "Offering Name", 
          null as "Study Start Date",
          null as "Study End Date",
          null as "Year of Study",
          null as "Offering Type",
          null as "Offering Status",
          null as "Offering Intensity"
        from 
          sims.education_programs ep 
          inner join sims.institutions i on i.id = ep.institution_id
          inner join sims.institution_locations il on il.institution_id = i.id
        where
          i.id = :institution
          and 
            case 
              when :sabcProgramCode = '''' then (ep.sabc_code is null or ep.sabc_code is not null)
              when :sabcProgramCode != '''' then ep.sabc_code = :sabcProgramCode
            end
          and ep.program_status in (''Approved'', ''Pending'')
          and (ep.is_active = true or ep.is_active_updated_on >= :startDate)
          and (ep.effective_end_date is null or ep.effective_end_date >= :startDate)
          and 
            case
            when array[''Part Time''] :: sims.offering_intensity [] = :offeringIntensity :: sims.offering_intensity [] 
              then ep.program_intensity = ''Full Time and Part Time''
              when array[''Full Time''] :: sims.offering_intensity [] = :offeringIntensity :: sims.offering_intensity [] 
              then ep.program_intensity = ''Full Time''
              else ep.program_intensity in (''Full Time'', ''Full Time and Part Time'')
            end
          and (select count(*) from sims.education_programs_offerings epo2 where epo2.program_id = ep.id) = 0
      )
      order by 
        "Institution Location Name",
        "Program Name",
        "Offering Name",
        "Offering Intensity"'
  );