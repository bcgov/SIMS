UPDATE
    sims.report_configs
SET report_sql = (
        'select
			      -- Application Processing Info
            applications.id as "Application ID",
			      applications.application_number as "Application Number",
            applications.application_status as "Application Status",
            current_assessment.assessment_date as "Assessment Date",
            current_assessment.trigger_type as "Re-assessment Indicator",
            current_assessment.workflow_data -> ''calculatedData'' ->> ''studentMaritalStatusCode'' as "Marital Status (or ''category'')",
            current_assessment.workflow_data -> ''studentData'' ->> ''dependantStatus'' as "Student Dependency Status",
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
            current_student_restrictions.current_restriction as "Current Active Student Restriction",
            previous_student_restrictions.previous_restriction as "Previous Student Restriction",
            cslf_disbursement_overawards.overaward_value as "CSL Overawards Balance (FT)",
            cslp_disbursement_overawards.overaward_value as "CSL Overawards Balance (PT)",
            bcsl_disbursement_overawards.overaward_value as "BCSL Overawards Balance",
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
            applications.data ->  ''custodyOfChildWelfare'' as "Youth in Care beyond age 19 Flag",
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
            applications.data ->> ''childSupport'' as "Child/Spousal Support amount",
            applications.data ->> ''livingathomeRent'' as "Living in parent house and paying living expenses amount",
            applications.data ->> ''transportationcostsEstimate'' as "Additional transportation amount (as applicable)",
            -- Parent Info Self-Reported by Student
            applications.data ->> ''pleaseProvideAnEstimationOfYourParentsIncome'' as "Parental estimated income self-reported",
            applications.data ->> ''studentParentNetAssests'' as "Parent value of canadian and foreign assets self reported",
            applications.data ->> ''studentParentNetContribution'' as "Parental contribution self-reported",
            -- Parent1 Info
            parent1_users.first_name as "Parent 1 first name",
            parent1_users.last_name as "Parent 1 last name",
            parent1.contact_info -> ''address'' ->> ''postalCode'' as "Parent 1 postal code",
            parent1.supporting_data ->> ''totalIncome'' as "Parent 1 income (line 15000)",
            current_assessment.workflow_data -> ''calculatedData'' ->> ''totalParentNetIncome'' as "Parent 1 net annual income (calculated value)",
            parent1.supporting_data ->> ''cppLine30800'' as "Parent 1 Canada pension plan contribution (line 30800)",
            parent1.supporting_data ->> ''cppLine31000'' as "Parent 1 Canada pension plan contribution (line 31000)",
            parent1.supporting_data ->> ''eiLine31200'' as "Parent 1 Employment Insurance Premium (Line 31200)",
            parent1.supporting_data ->> ''totalIncomeTaxLine43500'' as "Parent 1 Income tax paid (Line 43500)",
            parent1.supporting_data ->> ''parentalContributions'' as "Parent 1 contribution to student",
            parent1.supporting_data ->> ''parentsOtherDependants'' as "Parent 1 dependants other than applicant",
            jsonb_array_length(parent1.supporting_data -> ''parentDependentTable'') as "Parent 1 number of other dependants",
            parent1_dependant_number_post_sec_school.count as "Parent 1 number of dependants on post secondary school",
            parent1_dependant_number_disability.count as "Parent 1 number of dependants with disability",
            -- Parent2 Info
            parent2_users.first_name as "Parent 2 first name",
            parent2_users.last_name as "Parent 2 last name",
            parent2.contact_info -> ''address'' ->> ''postalCode'' as "Parent 2 postal code",
            parent2.supporting_data ->> ''totalIncome'' as "Parent 2 income (line 15000)",
            current_assessment.workflow_data -> ''calculatedData'' ->> ''totalParentNetIncome'' as "Parent 2 net annual income (calculated value)",
            parent2.supporting_data ->> ''cppLine30800'' as "Parent 2 Canada pension plan contribution (line 30800)",
            parent2.supporting_data ->> ''cppLine31000'' as "Parent 2 Canada pension plan contribution (line 31000)",
            parent2.supporting_data ->> ''eiLine31200'' as "Parent 2 Employment Insurance Premium (Line 31200)",
            parent2.supporting_data ->> ''totalIncomeTaxLine43500'' as "Parent 2 Income tax paid (Line 43500)",
            parent2.supporting_data ->> ''parentalContributions'' as "Parent 2 contribution to student",
            parent2.supporting_data ->> ''parentsOtherDependants'' as "Parent 2 dependants other than applicant",
            jsonb_array_length(parent1.supporting_data -> ''parentDependentTable'') as "Parent 2 number of other dependants",
            parent2_dependant_number_post_sec_school.count as "Parent 2 number of dependants on post secondary school",
            parent2_dependant_number_disability.count as "Parent 2 number of dependants with disability",
            -- Spouse Info
            partner_users.first_name as "Spouse''s first name",
            partner_users.last_name as "Spouse''s last name",
            partner.sin as "Spouse''s SIN",
            partner.supporting_data ->> ''totalIncome'' as "Partner income",
            partner.supporting_data ->> ''partnerEmployed'' as "Partner employment during study period (Yes/No)",
            partner.supporting_data ->> ''partnerCaringForDependant'' as "Partner caring for dependant (Yes/No )",
            partner.supporting_data ->> ''partnerLivingWithStudent'' as "Partner living with applicant (Yes/No)",
            partner.supporting_data ->> ''partnerStudentStudyWeeks'' as "Partner in Post-Secondary number of weeks",
            partner.supporting_data ->> ''partnerReceiveIncomeAssistance'' as "Partner social assistance amount",
            partner.supporting_data ->> ''willYourPartnerBeInReceiptOfEmploymentInsuranceBenefitsDuringTheYourStudyPeriodPanel'' as "Partner Employment Insurance amount",
            partner.supporting_data ->> ''partnerTotalPDBenefits'' as "Partner disability benefits amount",
            partner.supporting_data ->> ''willYourPartnerBePayingACanadaStudentLoanAndOrAProvincialStudentLoanRegularScheduledPaymentsDuringTheYourStudyPeriodPanel'' as "Partner Canada Student Loan amount",
            partner.supporting_data ->> ''partnerTotalSupport'' as "Partner child support amount",
            -- Partner Info Self-Reported by Student
            applications.data ->> ''estimatedSpouseIncome'' as "Partner estimated income self-reported",
            -- Family Info
            current_assessment.workflow_data -> ''calculatedData'' ->> ''familySize'' as "Family size",
            jsonb_array_length(applications.data -> ''dependants'') as "Number of dependant children in PSE",
            dependant_11_yo_or_disabled.count as "Number of Dep (0-11 y.o. and disabled 12 y.o. or older)",
            dependant_12_yo_or_other.count as "Number of Dep (12 y.o.+ NOT disabled) and Other Dep Relatives",
            applications.data ->> ''supportnocustodyDependants'' as "Has dependants without sole custody flag",
            -- Institution Info
            institution_locations.institution_code as "Institution Code (location code)",
            institution_locations.name as "Institution Location",
            institution_types.name as "Institution Type",
            institution_locations.info -> ''address'' ->> ''addressLine1'' as "Institution Address Line 1",
            institution_locations.info -> ''address'' ->> ''addressLine2'' as "Institution Address Line 2",
            institution_locations.info -> ''address'' ->> ''city'' as "Institution City",
            institution_locations.info -> ''address'' ->> ''provinceState'' as "Institution Province",
            institution_locations.info -> ''address'' ->> ''postalCode'' as "Institution Postal/Zip Code",
            institution_locations.info -> ''address'' ->> ''country'' as "Institution Country",
            -- Program Info
            education_programs.program_name as "Program name",
            education_programs.credential_type as "Credential type",
            education_programs.cip_code as "Classification of Instructional Program (CIP) Code",
            education_programs.field_of_study_code as "Field of Study Code",
            education_programs.noc_code as "National Occupation Classification",
            education_programs.sabc_code as "SABC Program Code",
            education_programs.institution_program_code as "Institution Program Code",
            education_programs.program_intensity as "Part-Time eligible",
            education_programs.delivered_on_site as "Program Delivery on site",
            education_programs.delivered_online as "Program Delivery online",
            education_programs.completion_years as "Program Length",
            -- Study Period Offering Info
            education_programs_offerings.offering_name as "Study Period Offering Name",
            education_programs_offerings.year_of_study as "Year of Study",
            education_programs_offerings.offering_intensity as "Offering intensity",
            education_programs_offerings.course_load as "Offering course load percentage",
            education_programs_offerings.offering_delivered as "Offering delivery method",
            education_programs_offerings.has_offering_wil_component as "Offering WIL component",
            education_programs_offerings.study_start_date as "Study Start date",
            education_programs_offerings.study_end_date as "Study End Date",
            education_programs_offerings.study_breaks ->> ''totalDays'' as "Total Offering Days",
            education_programs_offerings.study_breaks ->> ''totalFundedWeeks'' as "Total Funded Weeks",
            education_programs_offerings.study_breaks ->> ''fundedStudyPeriodDays'' as "Total Funded Study Period Days",
            education_programs_offerings.study_breaks ->> ''unfundedStudyPeriodDays'' as "Total Unfunded Study Period Days",
            education_programs_offerings.actual_tuition_costs as "Tuition",
            education_programs_offerings.program_related_costs as "Books and Supplies",
            education_programs_offerings.mandatory_fees as "Mandatory Fees",
            education_programs_offerings.exceptional_expenses as "Exceptional Costs",
            education_programs_offerings.offering_type as "Offering availability",
            -- Scholastic Standing Info
            student_scholastic_standings.submitted_data ->> ''dateOfCompletion'' as "Early completion date",
            student_scholastic_standings.submitted_data ->> ''dateOfWithdrawal'' as "Withdrawal date",
            student_scholastic_standings.submitted_data ->> ''numberOfUnsuccessfulWeeks'' as "Number of unsuccessful weeks",
            student_scholastic_standings.unsuccessful_weeks as "Total number of unsuccessful weeks for that student",
            -- Assessed Costs Info
            ''--TBD--'' as "Tuition", --offeringActualTuitionCosts
            ''--TBD--'' as "Mandatory fees", --offeringMandatoryFees
            current_assessment.assessment_data ->> ''booksAndSuppliesCost'' as "Books and supplies",
            current_assessment.assessment_data ->> ''exceptionalEducationCost'' as "Exceptional education costs",
            current_assessment.assessment_data ->> ''miscellaneousAllowance'' as "Living allowance",
            current_assessment.assessment_data ->> ''transportationCost'' as "Return transportation costs",
            current_assessment.assessment_data ->> ''childcareCost'' as "Child care costs",
            current_assessment.assessment_data ->> ''tuitionCost'' as "Other transportation costs (appeal)",
            ''--TBD--'' as "Total assessed costs", --calculatedDataTotalCosts
            -- Assessed Resources Info
            ''--TBD--'' as "Contribution from targeted funds ",
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
            current_assessment.assessment_data ->> ''assessedNeed'' as "Total assessed need",
            ''--TBD--'' as "Total assistance",
            ''--TBD--'' as "Unmet neeed",
            -- Potential Award Info
            potential_awards_cslf.value_amount as "CSL FT assessed amount",
            potential_awards_cslp.value_amount as "CSL PT assessed amount",
            potential_awards_bcsl.value_amount as "BCSL FT assessed amount",
            potential_awards_csgd.value_amount as "CSGD assessed amount",
            potential_awards_csgp.value_amount as "CSGP assessed amount",
            potential_awards_csgf.value_amount as "CSGF assessed amount",
            potential_awards_csgt.value_amount as "CSGT assessed amount",
            potential_awards_bcag.value_amount as "BCAG assessed amount",
            potential_awards_bgpd.value_amount as "BGPD assessed amount",
            potential_awards_sbsd.value_amount as "SBSD assessed amount",
            -- Confirmation of Enrolment Info
            disbursement_schedules.coe_status as "Confirmation of Enrolment Status",
            disbursement_schedules.coe_updated_at as "Date of Confirmation Enrollment Decision",
            -- Award Disbursement Info
            award_disbursements_cslf.effective_amount as "CSL FT disbursed amount",
            award_disbursements_cslp.effective_amount as "CSL PT disbursed amount",
            award_disbursements_bcsl.effective_amount as "BCSL FT disbursed amount",
            award_disbursements_csgd.effective_amount as "CSGD disbursed amount",
            award_disbursements_csgp.effective_amount as "CSGP disbursed amount",
            award_disbursements_csgf.effective_amount as "CSGF disbursed amount",
            award_disbursements_csgt.effective_amount as "CSGT disbursed amount",
            award_disbursements_bcag.effective_amount as "BCAG disbursed amount",
            award_disbursements_bgpd.effective_amount as "BGPD disbursed amount",
            award_disbursements_sbsd.effective_amount as "SBSD disbursed amount",
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
                    supporting_users.created_at asc
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
            left join sims.student_assessments current_assessment on applications.current_assessment_id = current_assessment.id
            left join sims.institution_locations institution_locations on institution_locations.id = applications.location_id
            left join sims.institutions institutions on institutions.id = institution_locations.institution_id
			      left join sims.institution_type institution_types on institution_types.id = institutions.institution_type_id
            left join sims.education_programs education_programs on education_programs.id = applications.pir_education_program_id
            left join sims.education_programs_offerings education_programs_offerings on current_assessment.offering_id = education_programs_offerings.id
            left join sims.student_scholastic_standings student_scholastic_standings on applications.id = student_scholastic_standings.application_id
            left join (
            	select sr.student_id, ''Yes'' as current_restriction
            	from sims.student_restrictions sr
            	where sr.is_active = true
            	limit 1
            ) as current_student_restrictions on current_student_restrictions.student_id = students.id
            left join (
            	select sr.student_id, ''Yes'' as previous_restriction
            	from sims.student_restrictions sr
            	where sr.is_active = false
            	limit 1
            ) as previous_student_restrictions on previous_student_restrictions.student_id = students.id
            left join  (
                select
                	ds.student_id,
                	ds.disbursement_value_code,
                    SUM (ds.overaward_value) as overaward_value
                from
                    sims.disbursement_overawards ds
                where ds.disbursement_value_code = ''CSLF''
                group by
                    ds.student_id,
                    ds.disbursement_value_code
            ) as cslf_disbursement_overawards on cslf_disbursement_overawards.student_id = students.id
            left join  (
                select
                	ds.student_id,
                	ds.disbursement_value_code,
                    SUM (ds.overaward_value) as overaward_value
                from
                    sims.disbursement_overawards ds
                where ds.disbursement_value_code = ''CSLP''
                group by
                    ds.student_id,
                    ds.disbursement_value_code
            ) as cslp_disbursement_overawards on cslp_disbursement_overawards.student_id = students.id
            left join  (
                select
                	ds.student_id,
                	ds.disbursement_value_code,
                    SUM (ds.overaward_value) as overaward_value
                from
                    sims.disbursement_overawards ds
                where ds.disbursement_value_code = ''BCSL''
                group by
                    ds.student_id,
                    ds.disbursement_value_code
            ) as bcsl_disbursement_overawards on bcsl_disbursement_overawards.student_id = students.id
            left join (
            	select a.id as application_id, count(1)
				from
					sims.applications a,
					jsonb_array_elements(a.data->''dependants'') b
				where (b->>''validDependent'')::integer <= 11 or jsonb_array_length(b->''pdDependentUpload'') > 0
				group by a.id
            ) as dependant_11_yo_or_disabled on dependant_11_yo_or_disabled.application_id = applications.id
            left join (
            	select a.id as application_id, count(1)
				from
					sims.applications a,
					jsonb_array_elements(a.data->''dependants'') b
				where (b->>''validDependent'')::integer > 11 or a.data ->> ''supportnocustodyDependants'' = ''yes''
				group by a.id
            ) as dependant_12_yo_or_other on dependant_12_yo_or_other.application_id = applications.id
            left join sims.disbursement_schedules disbursement_schedules on disbursement_schedules.student_assessment_id = current_assessment.id
           	left join (
            	select su.id, count(1)
				from
					sims.supporting_users su,
					jsonb_array_elements(su.supporting_data->''parentDependentTable'') b
				where (b->>''attendingPostSecondarySchool'')::text = ''yes''
				group by su.id
            ) as parent1_dependant_number_post_sec_school on parent1_dependant_number_post_sec_school.id = parent1.id
            left join (
            	select su.id, count(1)
				from
					sims.supporting_users su,
					jsonb_array_elements(su.supporting_data->''parentDependentTable'') b
				where (b->>''declaredOnTaxes'')::text = ''yes''
				group by su.id
            ) as parent1_dependant_number_disability on parent1_dependant_number_disability.id = parent1.id
           	left join (
            	select su.id, count(1)
				from
					sims.supporting_users su,
					jsonb_array_elements(su.supporting_data->''parentDependentTable'') b
				where (b->>''attendingPostSecondarySchool'')::text = ''yes''
				group by su.id
            ) as parent2_dependant_number_post_sec_school on parent2_dependant_number_post_sec_school.id = parent2.id
            left join (
            	select su.id, count(1)
				from
					sims.supporting_users su,
					jsonb_array_elements(su.supporting_data->''parentDependentTable'') b
				where (b->>''declaredOnTaxes'')::text = ''yes''
				group by su.id
            ) as parent2_dependant_number_disability on parent2_dependant_number_disability.id = parent2.id
            left join (
				select ds.student_assessment_id, sum(dv.value_amount) as value_amount
				from sims.disbursement_schedules ds, sims.disbursement_values dv
				where dv.disbursement_schedule_id = ds.id
				and dv.value_code = ''CSLF''
				group by ds.student_assessment_id
			) as potential_awards_cslf on potential_awards_cslf.student_assessment_id = current_assessment.id
            left join (
				select ds.student_assessment_id, sum(dv.value_amount) as value_amount
				from sims.disbursement_schedules ds, sims.disbursement_values dv
				where dv.disbursement_schedule_id = ds.id
				and dv.value_code = ''CSLP''
				group by ds.student_assessment_id
			) as potential_awards_cslp on potential_awards_cslp.student_assessment_id = current_assessment.id
            left join (
				select ds.student_assessment_id, sum(dv.value_amount) as value_amount
				from sims.disbursement_schedules ds, sims.disbursement_values dv
				where dv.disbursement_schedule_id = ds.id
				and dv.value_code = ''BCSL''
				group by ds.student_assessment_id
			) as potential_awards_bcsl on potential_awards_bcsl.student_assessment_id = current_assessment.id
            left join (
				select ds.student_assessment_id, sum(dv.value_amount) as value_amount
				from sims.disbursement_schedules ds, sims.disbursement_values dv
				where dv.disbursement_schedule_id = ds.id
				and dv.value_code = ''CSGD''
				group by ds.student_assessment_id
			) as potential_awards_csgd on potential_awards_csgd.student_assessment_id = current_assessment.id
            left join (
				select ds.student_assessment_id, sum(dv.value_amount) as value_amount
				from sims.disbursement_schedules ds, sims.disbursement_values dv
				where dv.disbursement_schedule_id = ds.id
				and dv.value_code = ''CSGP''
				group by ds.student_assessment_id
			) as potential_awards_csgp on potential_awards_csgp.student_assessment_id = current_assessment.id
            left join (
				select ds.student_assessment_id, sum(dv.value_amount) as value_amount
				from sims.disbursement_schedules ds, sims.disbursement_values dv
				where dv.disbursement_schedule_id = ds.id
				and dv.value_code = ''CSGF''
				group by ds.student_assessment_id
			) as potential_awards_csgf on potential_awards_csgf.student_assessment_id = current_assessment.id
			left join (
				select ds.student_assessment_id, sum(dv.value_amount) as value_amount
				from sims.disbursement_schedules ds, sims.disbursement_values dv
				where dv.disbursement_schedule_id = ds.id
				and dv.value_code = ''CSGT''
				group by ds.student_assessment_id
			) as potential_awards_csgt on potential_awards_csgt.student_assessment_id = current_assessment.id
			left join (
				select ds.student_assessment_id, sum(dv.value_amount) as value_amount
				from sims.disbursement_schedules ds, sims.disbursement_values dv
				where dv.disbursement_schedule_id = ds.id
				and dv.value_code = ''BCAG''
				group by ds.student_assessment_id
			) as potential_awards_bcag on potential_awards_bcag.student_assessment_id = current_assessment.id
			left join (
				select ds.student_assessment_id, sum(dv.value_amount) as value_amount
				from sims.disbursement_schedules ds, sims.disbursement_values dv
				where dv.disbursement_schedule_id = ds.id
				and dv.value_code = ''BGPD''
				group by ds.student_assessment_id
			) as potential_awards_bgpd on potential_awards_bgpd.student_assessment_id = current_assessment.id
			left join (
				select ds.student_assessment_id, sum(dv.value_amount) as value_amount
				from sims.disbursement_schedules ds, sims.disbursement_values dv
				where dv.disbursement_schedule_id = ds.id
				and dv.value_code = ''SBSD''
				group by ds.student_assessment_id
			) as potential_awards_sbsd on potential_awards_sbsd.student_assessment_id = current_assessment.id
			left join (
				select a.id as application_id, sum(dv.effective_amount) as effective_amount
				from sims.disbursement_schedules ds, sims.disbursement_values dv, sims.applications a, sims.student_assessments sa
				where dv.disbursement_schedule_id = ds.id
				and ds.student_assessment_id = sa.id
				and sa.application_id = a.id
				and dv.value_code = ''CSLF''
				group by a.id
			) as award_disbursements_cslf on award_disbursements_cslf.application_id = applications.id
			left join (
				select a.id as application_id, sum(dv.effective_amount) as effective_amount
				from sims.disbursement_schedules ds, sims.disbursement_values dv, sims.applications a, sims.student_assessments sa
				where dv.disbursement_schedule_id = ds.id
				and ds.student_assessment_id = sa.id
				and sa.application_id = a.id
				and dv.value_code = ''CSLP''
				group by a.id
			) as award_disbursements_cslp on award_disbursements_cslp.application_id = applications.id
			left join (
				select a.id as application_id, sum(dv.effective_amount) as effective_amount
				from sims.disbursement_schedules ds, sims.disbursement_values dv, sims.applications a, sims.student_assessments sa
				where dv.disbursement_schedule_id = ds.id
				and ds.student_assessment_id = sa.id
				and sa.application_id = a.id
				and dv.value_code = ''BCSL''
				group by a.id
			) as award_disbursements_bcsl on award_disbursements_bcsl.application_id = applications.id
			left join (
				select a.id as application_id, sum(dv.effective_amount) as effective_amount
				from sims.disbursement_schedules ds, sims.disbursement_values dv, sims.applications a, sims.student_assessments sa
				where dv.disbursement_schedule_id = ds.id
				and ds.student_assessment_id = sa.id
				and sa.application_id = a.id
				and dv.value_code = ''CSGD''
				group by a.id
			) as award_disbursements_csgd on award_disbursements_csgd.application_id = applications.id
			left join (
				select a.id as application_id, sum(dv.effective_amount) as effective_amount
				from sims.disbursement_schedules ds, sims.disbursement_values dv, sims.applications a, sims.student_assessments sa
				where dv.disbursement_schedule_id = ds.id
				and ds.student_assessment_id = sa.id
				and sa.application_id = a.id
				and dv.value_code = ''CSGP''
				group by a.id
			) as award_disbursements_csgp on award_disbursements_csgp.application_id = applications.id
			left join (
				select a.id as application_id, sum(dv.effective_amount) as effective_amount
				from sims.disbursement_schedules ds, sims.disbursement_values dv, sims.applications a, sims.student_assessments sa
				where dv.disbursement_schedule_id = ds.id
				and ds.student_assessment_id = sa.id
				and sa.application_id = a.id
				and dv.value_code = ''CSGF''
				group by a.id
			) as award_disbursements_csgf on award_disbursements_csgf.application_id = applications.id
			left join (
				select a.id as application_id, sum(dv.effective_amount) as effective_amount
				from sims.disbursement_schedules ds, sims.disbursement_values dv, sims.applications a, sims.student_assessments sa
				where dv.disbursement_schedule_id = ds.id
				and ds.student_assessment_id = sa.id
				and sa.application_id = a.id
				and dv.value_code = ''CSGT''
				group by a.id
			) as award_disbursements_csgt on award_disbursements_csgt.application_id = applications.id
			left join (
				select a.id as application_id, sum(dv.effective_amount) as effective_amount
				from sims.disbursement_schedules ds, sims.disbursement_values dv, sims.applications a, sims.student_assessments sa
				where dv.disbursement_schedule_id = ds.id
				and ds.student_assessment_id = sa.id
				and sa.application_id = a.id
				and dv.value_code = ''BCAG''
				group by a.id
			) as award_disbursements_bcag on award_disbursements_bcag.application_id = applications.id
			left join (
				select a.id as application_id, sum(dv.effective_amount) as effective_amount
				from sims.disbursement_schedules ds, sims.disbursement_values dv, sims.applications a, sims.student_assessments sa
				where dv.disbursement_schedule_id = ds.id
				and ds.student_assessment_id = sa.id
				and sa.application_id = a.id
				and dv.value_code = ''BGPD''
				group by a.id
			) as award_disbursements_bgpd on award_disbursements_bgpd.application_id = applications.id
			left join (
				select a.id as application_id, sum(dv.effective_amount) as effective_amount
				from sims.disbursement_schedules ds, sims.disbursement_values dv, sims.applications a, sims.student_assessments sa
				where dv.disbursement_schedule_id = ds.id
				and ds.student_assessment_id = sa.id
				and sa.application_id = a.id
				and dv.value_code = ''SBSD''
				group by a.id
			) as award_disbursements_sbsd on award_disbursements_sbsd.application_id = applications.id
       where
            education_programs_offerings.offering_intensity = any(:offeringIntensity)
            and applications.created_at between :startDate
            and :endDate
        order by
            applications.id, applications.application_number'
)
WHERE report_name = 'Data_Inventory_Report';
