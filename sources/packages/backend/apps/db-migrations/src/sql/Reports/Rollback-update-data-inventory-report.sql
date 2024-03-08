UPDATE
    sims.report_configs
SET report_sql = (
'       selectz
            -- Personal Info
            users.first_name as "First Name",
            users.last_name as "Last Name",
            students.birth_date as "Date of Birth",
            students.gender as "Gender",
            sin_validations.sin as "SIN",
            users.email as "Email address",
            students.contact_info -> ''address'' ->> ''addressLine1'' as "Address Line 1",
            students.contact_info -> ''address'' ->> ''addressLine2'' as "Address Line 2",
            students.contact_info -> ''address'' ->> ''city'' as "Contact City",
            students.contact_info -> ''address'' ->> ''provinceState'' as "Contact Province",
            students.contact_info -> ''address'' ->> ''postalCode'' as "Contact Postal/Zip Code",
            students.contact_info -> ''address'' ->> ''country'' as "Contact Country",
            students.contact_info ->> ''phone'' as "Contact Phone Number",
            -- Account Info
            (
                select
                    case
                        when exists (
                            select
                                1
                            from
                                sims.student_restrictions active_student_restrictions
                            where
                                active_student_restrictions.student_id = students.id
                                and active_student_restrictions.is_active = true
                        ) then ''Y''
                        else ''N''
                    end
            ) as "Active Restrictions Flag",
            (
                select
                    case
                        when exists (
                            select
                                1
                            from
                                sims.student_restrictions active_student_restrictions
                            where
                                active_student_restrictions.student_id = students.id
                                and active_student_restrictions.is_active <> true
                        ) then ''Y''
                        else ''N''
                    end
            ) as "Previous (inactive) Restrictions Flag",
            (
                select
                    SUM (disbursement_overawards.overaward_value)
                from
                    sims.disbursement_overawards disbursement_overawards
                where
                    disbursement_overawards.student_id = students.id
                    and disbursement_overawards.disbursement_value_code = ''CSLF''
                GROUP by
                    disbursement_overawards.student_id,
                    disbursement_overawards.disbursement_value_code
            ) as "CSL Overawards Balance (FT)",
            (
                select
                    SUM (disbursement_overawards.overaward_value)
                from
                    sims.disbursement_overawards disbursement_overawards
                where
                    disbursement_overawards.student_id = students.id
                    and disbursement_overawards.disbursement_value_code = ''CSLP''
                GROUP by
                    disbursement_overawards.student_id,
                    disbursement_overawards.disbursement_value_code
            ) as "CSL Overawards Balance (PT)",
            (
                select
                    SUM (disbursement_overawards.overaward_value)
                from
                    sims.disbursement_overawards disbursement_overawards
                where
                    disbursement_overawards.student_id = students.id
                    and disbursement_overawards.disbursement_value_code = ''BCSL''
                GROUP by
                    disbursement_overawards.student_id,
                    disbursement_overawards.disbursement_value_code
            ) as "BCSL Overawards Balance",
            students.disability_status as "Permanent Disability status",
            -- Application Personal Info (does not include Institution or Program info)
            ''"'' || program_years.program_year || ''"'' as "Program Year",
            applications.data ->> ''studentNumber'' as "Student Number",
            applications.data ->> ''citizenship'' as "Citizenship status",
            applications.data ->> ''bcResident'' as "BC Residency Status",
            applications.data ->> ''indigenousStatus'' as "Indigenous Person status",
            applications.data ->> ''aboriginalHeritage'' as "Indigenous category code",
            applications.data ->> ''applicationPDPPDStatus'' as "PD/PPD Application Flag",
            applications.data ->> ''youthInCare'' as "Youth in Care Flag",
            ''--TBD--'' as "Youth in Care beyond age 19 Flag",
            applications.data ->> ''outOfHighSchoolFor4Years'' as "Outside of highschool >4 years flag",
            applications.data ->> ''whenDidYouGraduateOrLeaveHighSchool'' as "High School Graduation Date",
            applications.data ->> ''fulltimelabourForce'' as "Recent Labour Force Participation Flag",
            applications.data ->> ''addTrustContactToContactSABC'' as "Trusted Contact Identified (Yes/No)",
            applications.data ->> ''relationshipStatus'' as "Marital Status",
            --Application Financial Info
            applications.data ->> ''taxReturnIncome'' as "Total income",
            applications.data ->> ''partTimeAwardTypesToBeConsidered'' as "Grant-only flag",
            applications.data ->> ''scholarshipsreceviedCosts'' as "Merit-based scholarship amount",
            applications.data ->> ''parentvoluntarycontributionsCosts'' as "Voluntary parental contribution amount",
            applications.data ->> ''governmentFundingCosts'' as "Government funding amount",
            applications.data ->> ''nongovernmentfundingCosts'' as "Non-government funding amount",
            applications.data ->> ''bcIncomeassistancefordisabilitiesCosts'' as "B.C. Income Assistance Amount",
            applications.data ->> ''returntriphomeCost'' as "Relocation costs",
            -- Application Financial Appeals Info
            applications.data ->> ''exceptionalExpensesApplicationException'' as "Exceptional expense amount",
            applications.data ->> ''daycareCosts11YearsOrUnder'' as "Daycare cost amount",
            applications.data ->> ''totalUnsubsidizedDayCareCostsDuringClassHoursForTheProposedStudyPeriodForDisabledInfirmedDependents12YearsOfAgeAndOlderPanel'' as "Unsubsidized daycare amount",
            ''--TBD--'' as "Child/Spousal Support amount",
            ''--TBD--'' as "Living in parent house and paying living expenses amount",
            applications.data ->> ''transportationcostsEstimate'' as "Additional transportation amount (as applicable)",
            -- Parent Info Self-Reported by Student
            applications.data ->> ''pleaseProvideAnEstimationOfYourParentsIncome'' as "Parental estimated income self-reported",
            applications.data ->> ''studentParentNetAssests'' as "Parent value of canadian and foreign assets self reported",
            applications.data ->> ''studentParentNetContribution'' as "Parental contribution self-reported",
            -- Parent1 Info
            parent1_users.first_name as "Parent 1 first name",
            parent1_users.last_name as "Parent 1 last name",
            parent1.contact_info -> ''address'' ->> ''postalCode'' as "Parent 1''s postal code",
            parent1.supporting_data ->> ''totalIncome'' as "Parental income (line 15000)",
            ''--TBD--'' as "Parental net annual income (calculated value)",
            ''--TBD--'' as "Parental value of assets",
            parent1.supporting_data ->> ''cppLine30800'' as "Canada pension plan contribution (line 30800)",
            parent1.supporting_data ->> ''cppLine31000'' as "Canada pension plan contribution (line 31000)",
            parent1.supporting_data ->> ''eiLine31200'' as "Employment Insurance Premium (Line 31200)",
            parent1.supporting_data ->> ''totalIncomeTaxLine43500'' as "Income tax paid (Line 43500)",
            ''--TBD--'' as "Total taxable income (Line 23600) (calculated value)",
            parent1.supporting_data ->> ''parentalContributions'' as "Parental contribution to student",
            parent1.supporting_data ->> ''parentsOtherDependants'' as "Parental dependants other than applicant",
            ''--TBD--'' as "Other dependants - age of dependant",
            ''--TBD--'' as "Other dependants - attending high school",
            ''--TBD--'' as "Other dependants - claimed for disability",
            -- Parent2 Info
            parent2_users.first_name as "Parent 2 first name",
            parent2_users.last_name as "Parent 2 last name",
            parent2.contact_info -> ''address'' ->> ''postalCode'' as "Parent 2''s postal code",
            parent2.supporting_data ->> ''totalIncome'' as "Parental income (line 15000)",
            ''--TBD--'' as "Parental net annual income (calculated value)",
            ''--TBD--'' as "Parental value of assets",
            parent2.supporting_data ->> ''cppLine30800'' as "Canada pension plan contribution (line 30800)",
            parent2.supporting_data ->> ''cppLine31000'' as "Canada pension plan contribution (line 31000)",
            parent2.supporting_data ->> ''eiLine31200'' as "Employment Insurance Premium (Line 31200)",
            parent2.supporting_data ->> ''totalIncomeTaxLine43500'' as "Income tax paid (Line 43500)",
            ''--TBD--'' as "Total taxable income (Line 23600) (calculated value)",
            parent2.supporting_data ->> ''parentalContributions'' as "Parental contribution to student",
            parent2.supporting_data ->> ''parentsOtherDependants'' as "Parental dependants other than applicant",
            ''--TBD--'' as "Other dependants - age of dependant",
            ''--TBD--'' as "Other dependants - attending high school",
            ''--TBD--'' as "Other dependants - claimed for disability",
            -- Spouse Info
            partner_users.first_name as "Spouse''s first name",
            partner_users.last_name as "Spouse''s last name",
            partner.sin as "Spouse''s SIN",
            partner.supporting_data ->> ''totalIncome'' as "Partner income",
            partner.supporting_data ->> ''partnerEmployed'' as "Partner employment during study period (Yes/No)",
            partner.supporting_data ->> ''partnerCaringForDependant'' as "Partner caring for dependant (Yes/No )",
            partner.supporting_data ->> ''partnerLivingWithStudent'' as "Partner living with applicant (Yes/No)",
            ''--TBD--'' as "Partner in Post-Secondary number of weeks",
            ''--TBD--'' as "Partner social assistance amount",
            ''--TBD--'' as "Partner Employment Insurance amount",
            ''--TBD--'' as "Partner disability benefits amount",
            ''--TBD--'' as "Partner Canada Student Loan amount",
            ''--TBD--'' as "Partner child support amount",
            -- Partner Info Self-Reported by Student
            applications.data ->> ''estimatedSpouseIncome'' as "Partner estimated income self-reported",
            -- Family Info
            student_assessments.workflow_data -> ''calculatedData'' ->> ''familySize'' as "Family size",
            jsonb_array_length(applications.data -> ''dependants'') as "Number of dependant children in PSE",
            ''--TBD--'' as "Number of Dep (0-11 y.o. and disabled 12 y.o. or older)",
            ''--TBD--'' as "Number of Dep (12 y.o.+ NOT disabled) and Other Dep Relatives",
            applications.data ->> ''supportnocustodyDependants'' as "Has dependants without sole custody flag",
            -- Institution Info
            institution_locations.institution_code as "Institution Code (location code)",
            ''--TBD--'' as "Alphabetical Institution Listing",
            ''--TBD--'' as "Institution Location",
            ''--TBD--'' as "Institution Type",
            ''--TBD--'' as "Institution Contact List",
            ''--TBD--'' as "De-designation",
            -- Program Info
            education_programs.program_name as "Program name",
            education_programs.credential_type as "Credential type",
            education_programs.cip_code as "Classification of Instructional Program (CIP) Code",
            education_programs.field_of_study_code as "Field of Study Code",
            education_programs.noc_code as "National Occupation Classification",
            education_programs.sabc_code as "SABC Program Code",
            education_programs.institution_program_code as "Institution Program Code",
            (
                case
                    when education_programs.program_intensity = ''Full Time and Part Time'' then ''Y''
                    else ''N''
                end
            ) as "Part-Time eligible (Yes/No)",
            ''--TBD--'' as "Program Delivery ",
            education_programs.completion_years as "Program Length",
            ''Credit or Hours Based'' as "Credit or Hours Based",
            ''--TBD--'' as "Program Regulatory Body",
            ''--TBD--'' as "Entrance Requirements",
            ''--TBD--'' as "Program ESL Content Percentage",
            ''--TBD--'' as "Program offered jointly/ in partnership (Yes/No)",
            ''--TBD--'' as "Program Work Integrated Learning (WIL) Component (Yes/No)",
            ''--TBD--'' as "WIL regulatory approval (Yes/No � as applicable)",
            ''--TBD--'' as "Program Field Trip / Travel Component (Yes/No)",
            ''--TBD--'' as "Program international exchange component (Yes/No)",
            ''--TBD--'' as "Program was pending but then aproved",
            -- Study Period Offering Info
            education_programs_offerings.offering_name as "Study Period Offering Name",
            education_programs_offerings.year_of_study as "Year of Study",
            education_programs_offerings.offering_intensity as "Offering intensity",
            ''--TBD--'' as "Offering course load percentage",
            education_programs_offerings.offering_delivered as "Offering delivery method",
            ''--TBD--'' as "Offering WIL component (Yes/No)",
            to_char(
                education_programs_offerings.study_start_date,
                ''YYYY-MM-DD''
            ) as "Study Start date",
            to_char(
                education_programs_offerings.study_end_date,
                ''YYYY-MM-DD''
            ) as "Study End Date",
            ''--TBD--'' as "Study Break Start Date(s)",
            ''--TBD--'' as "Study Break End Date(s)",
            ''--TBD--'' as "Total Offering Days",
            ''--TBD--'' as "Total Funded Weeks",
            ''--TBD--'' as "Total Funded Study Period Days",
            ''--TBD--'' as "Total Unfunded Study Period Days",
            education_programs_offerings.actual_tuition_costs as "Tuition",
            education_programs_offerings.program_related_costs as "Books and Supplies",
            education_programs_offerings.mandatory_fees as "Mandatory Fees",
            education_programs_offerings.exceptional_expenses as "Exceptional Costs",
            ''--TBD--'' as "Offering availability",
            ''--TBD--'' as "Offering pending flag",
            -- Scholastic Standing Info
            ''--TBD--'' as "Early completion date",
            student_scholastic_standings.submitted_data ->> ''dateOfWithdrawal'' as "Withdrawal date",
            student_scholastic_standings.unsuccessful_weeks as "Number of unsuccessful weeks",
            ''--TBD--'' as "Total number of unsuccessful weeks for that student",
            -- Re-assessment Info
            ''--TBD--'' as "Reason for F. Student Contr. Exemp.: Indigenous",
            ''--TBD--'' as "Reason for F. Student Contr. Exemp.: PD",
            ''--TBD--'' as "Reason for F. Student Contr. Exemp.: Dependants",
            ''--TBD--'' as "Reason for F. Student Contr. Exemp.: Cur. or Former Crown Ward",
            ''--TBD--'' as "Reason for F. Rate Spousal Contr. Exemp.: Student",
            ''--TBD--'' as "Reason for F. Rate Spousal Contr. Exemp.: Rec. Employment Ins.",
            ''--TBD--'' as "Reason for F. Rate Spousal Contr. Exemp.: Rec. Social Assist.",
            ''--TBD--'' as "Reason for F. Rat. Spo. Contr. Exemp.: Rec. fed./prov. dis. ben",
            ''--TBD--'' as "Fixed student contribution review flag",
            ''--TBD--'' as "parental contribution review flag",
            ''--TBD--'' as "Fixed spousal contribution review flag",
            -- Application Processing Info
            applications.application_number as "Application Number",
            ''--TBD--'' as "Version Number",
            applications.application_status as "Application Status",
            to_char(
                student_assessments.assessment_date,
                ''YYYY-MM-DD''
            ) as "Assessment Date",
            student_assessments.trigger_type as "Re-assessment Indicator",
            ''--TBD--'' as "CSL Loan authorization date",
            student_assessments.workflow_data -> ''studentData'' ->> ''relationshipStatus'' as "Marital Status (or ''category'')",
            student_assessments.workflow_data -> ''studentData'' ->> ''dependantStatus'' as "Student Dependency Status",
            ''--TBD--'' as "Reason for Single Independant Status",
            -- Verification Info
            (
                (
                    select
                        count(1)
                    from
                        sims.applications a
                    where
                        a.application_number = applications.application_number
                ) -1 --Number of editions after the first input
            ) as "Edit history",
            ''--TBD--'' as "Number of edits to income fields",
            (
                select
                    a.data ->> ''taxReturnIncome''
                from
                    sims.applications a
                where
                    a.application_number = applications.application_number
                order by
                    id desc
                limit
                    1
            ) as "Student Income (from last edit)",
            (
                select
                    a.data ->> ''taxReturnIncome''
                from
                    sims.applications a
                where
                    a.application_number = applications.application_number
                order by
                    id desc
                limit
                    1 offset 1
            ) as "Student income (from two edits ago)",
            (
                select
                    a.data ->> ''pleaseProvideAnEstimationOfYourParentsIncome''
                from
                    sims.applications a
                where
                    a.application_number = applications.application_number
                order by
                    id desc
                limit
                    1
            ) as "Self-reported Parental income (from last edit)",
            (
                select
                    a.data ->> ''pleaseProvideAnEstimationOfYourParentsIncome''
                from
                    sims.applications a
                where
                    a.application_number = applications.application_number
                order by
                    id desc
                limit
                    1 offset 1
            ) as "Self-reported Parental income (from two edits ago)",
            (
                select
                    a.data ->> ''studentParentNetAssests''
                from
                    sims.applications a
                where
                    a.application_number = applications.application_number
                order by
                    id desc
                limit
                    1
            ) as "Self-reported Parent net value of Can. assets (from last edit)",
            (
                select
                    a.data ->> ''studentParentNetAssests''
                from
                    sims.applications a
                where
                    a.application_number = applications.application_number
                order by
                    id desc
                limit
                    1 offset 1
            ) as "Self-reported Parent net value of Can. assets (two edits ago)",
            (
                select
                    a.data ->> ''studentParentNetContribution''
                from
                    sims.applications a
                where
                    a.application_number = applications.application_number
                order by
                    id desc
                limit
                    1
            ) as "Self-reported Parent contr. towards ed. costs (last edit)",
            (
                select
                    a.data ->> ''studentParentNetContribution''
                from
                    sims.applications a
                where
                    a.application_number = applications.application_number
                order by
                    id desc
                limit
                    1 offset 1
            ) as "Self-reported Parent contr. towards ed. costs (two edits ago)",
            (
                select
                    a.data ->> ''estimatedSpouseIncome''
                from
                    sims.applications a
                where
                    a.application_number = applications.application_number
                order by
                    id desc
                limit
                    1
            ) as "Self-reported spousal income (from last edit)",
            (
                select
                    a.data ->> ''estimatedSpouseIncome''
                from
                    sims.applications a
                where
                    a.application_number = applications.application_number
                order by
                    id desc
                limit
                    1 offset 1
            ) as "Self-reported spousal income (from two edits ago)",
            -- Assessed Costs Info
            ''--TBD--'' as "Tuition",
            ''--TBD--'' as "Mandatory fees",
            student_assessments.assessment_data ->> ''booksAndSuppliesCost'' as "Books and supplies",
            student_assessments.assessment_data ->> ''exceptionalEducationCost'' as "Exceptional education costs",
            student_assessments.assessment_data ->> ''miscellaneousAllowance'' as "Living allowance",
            student_assessments.assessment_data ->> ''transportationCost'' as "Return transportation costs",
            student_assessments.assessment_data ->> ''childcareCost'' as "Child care costs",
            student_assessments.assessment_data ->> ''tuitionCost'' as "Other transportation costs (appeal)",
            ''--TBD--'' as "Other allowable costs",
            ''--TBD--'' as "Total assessed costs",
            -- Assessed Resources Info
            ''--TBD--'' as "Contribution from targetted funds ",
            ''--TBD--'' as "Contribution from scholarships/bursaries/awards",
            ''--TBD--'' as "Student fixed contribution",
            ''--TBD--'' as "Parental income contribution",
            ''--TBD--'' as "Parental asset contribution",
            ''--TBD--'' as "Parental voluntary contribution",
            ''--TBD--'' as "Parent contribution",
            ''--TBD--'' as "Spouse contribution",
            ''--TBD--'' as "Other resources ",
            ''--TBD--'' as "Total assessed resources",
            -- Assessed Need
            ''--TBD--'' as "Total assessed need",
            ''--TBD--'' as "Total assistance",
            ''--TBD--'' as "Unmet need",
            -- Potential Award Info
            ''--TBD--'' as "CSL FT assessed amount",
            ''--TBD--'' as "CSL PT assessed amount",
            ''--TBD--'' as "BCSL FT assessed amount",
            ''--TBD--'' as "CSL FT assessed amount",
            ''--TBD--'' as "CSGD assessed amount",
            ''--TBD--'' as "CSGP assessed amount",
            ''--TBD--'' as "CSGF assessed amount",
            ''--TBD--'' as "CSGT assessed amount",
            ''--TBD--'' as "BCAG assessed amount",
            ''--TBD--'' as "BGPD assessed amount",
            ''--TBD--'' as "SBSD assessed amount",
            -- Confirmation of Enrolment Info
            ''--TBD--'' as "Confirmation of Enrolment Approved / Declined?",
            ''--TBD--'' as "Date of Confirmation Enrollment Decision",
            -- Award Disbursement Info
            ''--TBD--'' as "CSL FT disbursed amount",
            ''--TBD--'' as "CSL PT disbursed amount",
            ''--TBD--'' as "BCSL FT disbursed amount",
            ''--TBD--'' as "CSL FT disbursed amount",
            ''--TBD--'' as "CSGD disbursed amount",
            ''--TBD--'' as "CSGP disbursed amount",
            ''--TBD--'' as "CSGF disbursed amount",
            ''--TBD--'' as "CSGT disbursed amount",
            ''--TBD--'' as "BCAG disbursed amount",
            ''--TBD--'' as "BGPD disbursed amount",
            ''--TBD--'' as "SBSD disbursed amount",
            -- Disbursement Info
            ''--TBD--'' as "Date of 1st Disbursement",
            ''--TBD--'' as "Date of 2nd Disbursement"
        from
            sims.applications applications
            inner join sims.students students on applications.student_id = students.id
            inner join sims.users users on students.user_id = users.id
            inner join sims.sin_validations sin_validations on students.sin_validation_id = sin_validations.id
            inner join sims.program_years program_years on applications.program_year_id = program_years.id
            left join sims.cra_income_verifications cra_income_verifications on applications.id = cra_income_verifications.application_id
            and cra_income_verifications.supporting_user_id is null
            left join (
                select
                    *
                from
                    sims.supporting_users supporting_users
                where
                    supporting_users.supporting_user_type = ''Parent''
                order by
                    supporting_users.created_at
                limit
                    1
            ) parent1 on applications.id = parent1.application_id
            left join sims.users parent1_users on parent1.user_id = parent1_users.id
            left join (
                select
                    *
                from
                    sims.supporting_users supporting_users
                where
                    supporting_users.supporting_user_type = ''Parent''
                order by
                    supporting_users.created_at desc
                limit
                    1
            ) parent2 on applications.id = parent2.application_id
            left join sims.users parent2_users on parent2.user_id = parent2_users.id
            left join sims.supporting_users partner on partner.supporting_user_type = ''Partner''
            and applications.id = partner.application_id
            left join sims.users partner_users on partner.user_id = partner_users.id
            left join sims.student_assessments student_assessments on applications.id = student_assessments.id
            left join sims.institution_locations institution_locations on institution_locations.id = applications.location_id
            left join sims.education_programs education_programs on education_programs.id = applications.pir_education_program_id
            left join sims.education_programs_offerings education_programs_offerings on student_assessments.offering_id = education_programs_offerings.id
            left join sims.student_scholastic_standings student_scholastic_standings on applications.id = student_scholastic_standings.application_id
        where
            applications.application_status <> ''Overwritten''
            and education_programs_offerings.offering_intensity = any(:offeringIntensity)
            and applications.created_at between :startDate
            and :endDate
        order by
            applications.id'
    )
    WHERE report_name = 'Data_Inventory_Report';
