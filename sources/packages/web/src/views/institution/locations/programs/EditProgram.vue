<template>
  <full-page-container>
    <template #header>
      <header-navigator
        :title="backTarget.name"
        :route-location="backTarget.to"
        sub-title="Edit Program"
      />
    </template>
    <body-header-container title="Program"
      ><content-group>
        <error-summary :errors="editProgramForm.errors" />
        <v-skeleton-loader :loading="loading" type="article, text@5">
          <v-form ref="editProgramForm">
            <body-header-container title="Program details" header-size="medium">
              <content-group>
                <v-text-field
                  v-model="editProgramFormModel.name"
                  density="compact"
                  label="Program name"
                  variant="outlined"
                  :rules="[
                    (v) =>
                      checkLengthRule(
                        v,
                        PROGRAM_NAME_MAX_LENGTH,
                        'Program name',
                      ),
                  ]"
                />
                <v-textarea
                  v-model="editProgramFormModel.description"
                  variant="outlined"
                  label="Program description"
                  required
                  class="mt-4"
                  :rules="[
                    (v) =>
                      checkLengthRule(
                        v,
                        PROGRAM_DESCRIPTION_MAX_LENGTH,
                        'Program description',
                        false,
                      ),
                  ]"
                ></v-textarea>
                <v-text-field
                  v-model="editProgramFormModel.cipCode"
                  density="compact"
                  label="Classification of Instructional Programs (CIP)"
                  variant="outlined"
                  hint="Format (##.####)"
                  persistent-hint
                  :rules="[
                    (v) =>
                      checkRegexPattern(
                        v,
                        /^[0-9]{2}\.[0-9]{4}$/,
                        'Classification of Instructional Programs (CIP)',
                      ),
                  ]"
                />
                <v-text-field
                  :model-value="editProgramFormModel.fieldOfStudyCode"
                  density="compact"
                  label="Field of study code"
                  variant="outlined"
                  readonly
                />
                <v-text-field
                  v-model="editProgramFormModel.nocCode"
                  density="compact"
                  label="National Occupational Classification (NOC)"
                  variant="outlined"
                  hint="Format (#####) Optional**"
                  persistent-hint
                  :rules="[
                    (v) =>
                      checkRegexPattern(
                        v,
                        /[0-9]{5}/,
                        'National Occupational Classification (NOC)',
                        false,
                      ),
                  ]"
                />
                <v-text-field
                  v-model="editProgramFormModel.sabcCode"
                  density="compact"
                  label="SABC program code"
                  variant="outlined"
                  hint="Format (XXX#) Mandatory field if using the 'Offerings Upload' feature. Otherwise optional."
                  persistent-hint
                  :rules="[
                    (v) =>
                      checkRegexPattern(
                        v,
                        /[[A-Z]{3}[0-9]{1}/,
                        'SABC program code',
                        false,
                      ),
                  ]"
                />
                <v-text-field
                  v-model="editProgramFormModel.institutionProgramCode"
                  density="compact"
                  label="Institution Program Code"
                  variant="outlined"
                  persistent-hint
                  :rules="[
                    (v) =>
                      checkLengthRule(
                        v,
                        INSTITUTION_PROGRAM_CODE_MAX_LENGTH,
                        'Institution Program Code',
                        false,
                      ),
                  ]"
                /> </content-group
            ></body-header-container>
            <body-header-container
              title="Program eligibility"
              header-size="medium"
            >
              <content-group>
                <option-items-radio
                  v-model="editProgramFormModel.programIntensity"
                  color="primary"
                  label="Are students able to take this on a part time basis?"
                  :items="PROGRAM_INTENSITY_ITEMS"
                  :rules="[
                    (v: string) =>
                      checkNullOrEmptyRule(
                        v,
                        'Are students able to take this on a part time basis?',
                      ),
                  ]"
                ></option-items-radio>
                <option-items-checkbox
                  v-model="editProgramFormModel.programDeliveryTypes"
                  color="primary"
                  label="How will this program be delivered? (Select all that apply)"
                  :items="PROGRAM_DELIVERY_ITEMS"
                  :rules="[
                    (v) =>
                      v.length > 0 ||
                      'At least one program delivery type must be selected.',
                  ]"
                ></option-items-checkbox>
                <program-eligibility-banner
                  v-if="bannerDisplayConditions.showBCPrivateOnlyOnlineBanner"
                  header="This program requires review by StudentAid BC to determine eligibility."
                />
                <option-items-radio
                  v-if="
                    componentDisplayConditions.showDeliveredOnlineAlsoOnsite
                  "
                  v-model="editProgramFormModel.deliveredOnlineAlsoOnsite"
                  color="primary"
                  label="Will the program also be offered and delivered at 100% course load on site?"
                  :items="YES_NO_VALUE_ITEMS"
                ></option-items-radio>
                <option-items-radio
                  v-if="componentDisplayConditions.showSameOnlineCreditsEarned"
                  v-model="editProgramFormModel.sameOnlineCreditsEarned"
                  color="primary"
                  label="Will the students earn the same number of credits in the same time period as students in other StudentAid BC eligible programs delivered on site?"
                  :items="YES_NO_VALUE_ITEMS"
                ></option-items-radio>
                <option-items-radio
                  v-if="
                    componentDisplayConditions.showAcademicCreditsOtherInstitution
                  "
                  v-model="
                    editProgramFormModel.earnAcademicCreditsOtherInstitution
                  "
                  color="primary"
                  label="Will they earn academic credits that are recognized at another designated institution listed in the BC Transfer Guide or other acceptable articulation agreements from other jurisdictions?"
                  :items="YES_NO_VALUE_ITEMS"
                ></option-items-radio>
                <program-eligibility-banner
                  v-if="
                    bannerDisplayConditions.showNonBCInstitutionAcademicCreditsBanner
                  "
                />
                <v-select
                  label="Program length"
                  density="compact"
                  :items="PROGRAM_LENGTH_ITEMS"
                  v-model="editProgramFormModel.completionYears"
                  variant="outlined"
                  hide-details="auto"
                  :rules="[(v) => checkNullOrEmptyRule(v, 'Program length')]"
                />
                <option-items-radio
                  v-model="editProgramFormModel.courseLoadCalculation"
                  color="primary"
                  label="Program course load calculation is:"
                  :items="PROGRAM_COURSE_LOAD_ITEMS"
                  :rules="[
                    (v: string) =>
                      checkNullOrEmptyRule(
                        v,
                        'Program course load calculation:',
                      ),
                  ]"
                ></option-items-radio>
                <option-items-radio
                  v-if="componentDisplayConditions.showMinHoursWeek"
                  v-model="editProgramFormModel.minHoursWeek"
                  color="primary"
                  label="Does this program include a minimum of 20 instructional hours per week?"
                  :items="YES_NO_VALUE_ITEMS"
                  :rules="[
                    (v: string) =>
                      checkNullOrEmptyRule(
                        v,
                        'Does this program include a minimum of 20 instructional hours per week?',
                      ),
                  ]"
                ></option-items-radio>
                <program-eligibility-banner
                  v-if="bannerDisplayConditions.showLessThanMinHoursWeekBanner"
                  summary="The program needs to be a minimum of 20 instructional hours."
                />
                <v-select
                  label="Which regulatory body does this program belong to?"
                  density="compact"
                  :items="REGULATORY_BODY_ITEMS"
                  v-model="editProgramFormModel.regulatoryBody"
                  variant="outlined"
                  :rules="[
                    (v) =>
                      checkNullOrEmptyRule(
                        v,
                        'Which regulatory body does this program belong to?',
                      ),
                  ]"
                />
                <v-text-field
                  v-if="componentDisplayConditions.showOtherRegulatoryBody"
                  v-model="editProgramFormModel.otherRegulatoryBody"
                  density="compact"
                  label="Other institution regulatory body"
                  variant="outlined"
                  hide-details="auto"
                  :rules="[
                    (v) =>
                      checkLengthRule(
                        v,
                        OTHER_REGULATORY_BODY_MAX_LENGTH,
                        'Other institution regulatory body',
                      ),
                  ]"
                />
              </content-group>
            </body-header-container>
            <body-header-container
              title="Entrance requirements"
              header-size="medium"
            >
              <content-group>
                <option-items-checkbox
                  v-model="editProgramFormModel.entranceRequirements"
                  color="primary"
                  label="What are the entrance requirements for this program? (Select all that apply)"
                  :items="ENTRANCE_REQUIREMENT_ITEMS"
                  :rules="[
                    (v) =>
                      v.length > 0 ||
                      'At least one entrance requirement must be selected.',
                  ]"
                ></option-items-checkbox>
                <program-eligibility-banner
                  v-if="
                    bannerDisplayConditions.showNoEntranceRequirementsBanner
                  "
                  summary="An entrance requirement is required."
                />
              </content-group>
            </body-header-container>
            <body-header-container
              title="English as a Second Language (ESL) content"
              header-size="medium"
            >
              <content-group>
                <option-items-radio
                  v-model="editProgramFormModel.eslEligibility"
                  color="primary"
                  label="What percentage of the program has ESL Content?"
                  :items="PROGRAM_ESL_ITEMS"
                  :rules="[
                    (v: string) =>
                      checkNullOrEmptyRule(
                        v,
                        'What percentage of the program has ESL Content?',
                      ),
                  ]"
                ></option-items-radio>
                <program-eligibility-banner
                  v-if="bannerDisplayConditions.showExceedingESLBanner"
                  summary="ESL can't exceed 20% of course content."
                />
              </content-group>
            </body-header-container>
            <body-header-container
              title="Program partnerships"
              header-size="medium"
            >
              <content-group>
                <option-items-radio
                  v-model="editProgramFormModel.hasJointInstitution"
                  color="primary"
                  label="Is the program offered jointly or in partnership with other institutions?"
                  :items="YES_NO_VALUE_ITEMS"
                  :rules="[
                    (v: string) =>
                      checkNullOrEmptyRule(
                        v,
                        'Is the program offered jointly or in partnership with other institutions?',
                      ),
                  ]"
                ></option-items-radio>
                <option-items-radio
                  v-if="
                    componentDisplayConditions.showHasJointDesignatedInstitution
                  "
                  v-model="editProgramFormModel.hasJointDesignatedInstitution"
                  color="primary"
                  label="Are all institutions you partner with for this program designated by StudentAid BC?"
                  :items="YES_NO_VALUE_ITEMS"
                  :rules="[
                    (v: string) =>
                      checkNullOrEmptyRule(
                        v,
                        'Are all institutions you partner with for this program designated by StudentAid BC?',
                      ),
                  ]"
                ></option-items-radio>
                <program-eligibility-banner
                  v-if="
                    bannerDisplayConditions.showJointDesignatedInstitutionBanner
                  "
                  header="Partner program review"
                >
                  <template #content>
                    <span
                      >This program requires additional review by StudentAid BC.
                      Please email
                      <a href="mailto:designat@gov.bc.ca">designat@gov.bc.ca</a>
                      the name of the institution that you have partnered with,
                      the name of this program, and any other details you want
                      included as part of the review for this program.</span
                    >
                  </template>
                </program-eligibility-banner>
                <program-eligibility-banner
                  v-if="
                    bannerDisplayConditions.showJointNonDesignatedInstitutionBanner
                  "
                  summary="All partner institutions must be designated by StudentAid BC."
                />
              </content-group>
            </body-header-container>
            <body-header-container
              title="Work-integrated learning (WIL)"
              header-size="medium"
            >
              <content-group>
                <option-items-radio
                  v-model="editProgramFormModel.hasWILComponent"
                  color="primary"
                  label="Does this program have a WIL component?"
                  :items="YES_NO_VALUE_ITEMS"
                  :rules="[
                    (v: string) =>
                      checkNullOrEmptyRule(
                        v,
                        'Does this program have a WIL component?',
                      ),
                  ]"
                ></option-items-radio>
                <option-items-radio
                  v-if="componentDisplayConditions.showIsWILApproved"
                  v-model="editProgramFormModel.isWILApproved"
                  color="primary"
                  label="Is the WIL approved by your regulator or oversight body?"
                  :items="YES_NO_VALUE_ITEMS"
                  :rules="[
                    (v: string) =>
                      checkNullOrEmptyRule(
                        v,
                        'Is the WIL approved by your regulator or oversight body?',
                      ),
                  ]"
                ></option-items-radio>
                <program-eligibility-banner
                  v-if="bannerDisplayConditions.showWILNotApprovalBanner"
                  summary="The work-integrated learning component must be approved by your regulator or oversight body first."
                />
                <option-items-radio
                  v-if="componentDisplayConditions.showWILProgramEligibility"
                  v-model="editProgramFormModel.wilProgramEligibility"
                  color="primary"
                  label="Does the WIL meet the program eligibility requirements according to StudentAid BC policy?"
                  :items="YES_NO_VALUE_ITEMS"
                ></option-items-radio>
                <program-eligibility-banner
                  v-if="bannerDisplayConditions.showWILEligibilityBanner"
                  summary="This must meet the StudentAid BC policy."
                />
              </content-group>
            </body-header-container>
            <body-header-container
              title="Field trip, field placement, or travel"
              header-size="medium"
            >
              <content-group>
                <option-items-radio
                  v-model="editProgramFormModel.hasTravel"
                  color="primary"
                  label="Is a field trip, field placement or travel part of this program?"
                  :items="YES_NO_VALUE_ITEMS"
                  :rules="[
                    (v: string) =>
                      checkNullOrEmptyRule(
                        v,
                        'Is a field trip, field placement or travel part of this program?',
                      ),
                  ]"
                ></option-items-radio>
                <option-items-radio
                  v-if="componentDisplayConditions.showTravelProgramEligibility"
                  v-model="editProgramFormModel.travelProgramEligibility"
                  color="primary"
                  label="Does the field trip, field placement, or travel meet the program eligibility requirements according to StudentAid BC policy?"
                  :items="YES_NO_VALUE_ITEMS"
                  :rules="[
                    (v: string) =>
                      checkNullOrEmptyRule(
                        v,
                        'Does the field trip, field placement, or travel meet the program eligibility requirements according to StudentAid BC policy?',
                      ),
                  ]"
                ></option-items-radio>
                <program-eligibility-banner
                  v-if="bannerDisplayConditions.showTravelEligibilityBanner"
                  summary="This must meet the StudentAid BC policy."
                />
              </content-group>
            </body-header-container>
            <body-header-container
              title="International exchange"
              header-size="medium"
            >
              <content-group>
                <option-items-radio
                  v-model="editProgramFormModel.hasIntlExchange"
                  color="primary"
                  label="Does the program have an international exchange?"
                  :items="YES_NO_VALUE_ITEMS"
                  :rules="[
                    (v: string) =>
                      checkNullOrEmptyRule(
                        v,
                        'Does the program have an international exchange?',
                      ),
                  ]"
                ></option-items-radio>
                <option-items-radio
                  v-if="
                    componentDisplayConditions.showIntlExchangeProgramEligibility
                  "
                  v-model="editProgramFormModel.intlExchangeProgramEligibility"
                  color="primary"
                  label="Does the international exchange meet the program eligibility requirements according to StudentAid BC policy?"
                  :items="YES_NO_VALUE_ITEMS"
                  :rules="[
                    (v: string) =>
                      checkNullOrEmptyRule(
                        v,
                        'Does the international exchange meet the program eligibility requirements according to StudentAid BC policy?',
                      ),
                  ]"
                ></option-items-radio>
              </content-group>
            </body-header-container>
            <body-header-container title="Aviation" header-size="medium">
              <content-group>
                <option-items-radio
                  v-model="editProgramFormModel.isAviationProgram"
                  color="primary"
                  label="Does this program contain aviation?"
                  :items="YES_NO_VALUE_ITEMS"
                  :rules="[
                    (v: string) =>
                      checkNullOrEmptyRule(
                        v,
                        'Does this program contain aviation?',
                      ),
                  ]"
                ></option-items-radio>
                <option-items-checkbox
                  v-if="componentDisplayConditions.showAviationDetails"
                  v-model="editProgramFormModel.credentialTypesAviation"
                  color="primary"
                  label="Which credential type(s) are included? (Select all that apply)"
                  :items="AVIATION_CREDENTIAL_ITEMS"
                  :rules="[
                    (v) =>
                      v.length > 0 ||
                      'At least one credential type must be selected.',
                  ]"
                ></option-items-checkbox>
                <option-items-radio
                  v-if="componentDisplayConditions.showAviationDetails"
                  v-model="editProgramFormModel.minHoursWeekAvi"
                  color="primary"
                  label="Does this program include a minimum of 15 instructional hours per week?"
                  :items="YES_NO_VALUE_ITEMS"
                  :rules="[
                    (v: string) =>
                      checkNullOrEmptyRule(
                        v,
                        'Does this program include a minimum of 15 instructional hours per week?',
                      ),
                  ]"
                ></option-items-radio>
              </content-group>
            </body-header-container>
            <body-header-container title="Declaration" header-size="medium">
              <content-group>
                <p class="category-header-medium-small primary-color">
                  All information is subject to verification and auditing.
                </p>
                <v-checkbox
                  label="I confirm this program meets the policies outlined in the StudentAid BC policy manual."
                  color="primary"
                  v-model="editProgramFormModel.programDeclaration"
                  hide-details="auto"
                  :rules="[requiredDeclarationRule]"
                />
              </content-group>
            </body-header-container>
          </v-form>
        </v-skeleton-loader>
      </content-group>
      <footer-buttons
        primary-label="Update"
        @secondary-click="cancel"
        @primary-click="submit"
        :disable-primary-button="loading"
    /></body-header-container>
  </full-page-container>
</template>
<script setup lang="ts">
import { useProgram, useRules, useSnackBar } from "@/composables";
import {
  PROGRAM_NAME_MAX_LENGTH,
  PROGRAM_DESCRIPTION_MAX_LENGTH,
  INSTITUTION_PROGRAM_CODE_MAX_LENGTH,
  OTHER_REGULATORY_BODY_MAX_LENGTH,
} from "@/constants/program-constants";
import { computed, ref, watchEffect } from "vue";
import type { BackTarget, ComponentItemType, VForm } from "@/types";
import {
  FormYesNoOptions,
  ProgramIntensity,
  ProgramCourseLoadCalculationTypes,
  ProgramDeliveryTypeValues,
  ProgramESLPercentage,
} from "@/types";
import { EducationProgramService } from "@/services/EducationProgramService";
import { useRouter } from "vue-router";
import OptionItemsRadio from "@/components/generic/OptionItemsRadio.vue";
import OptionItemsCheckbox from "@/components/generic/OptionItemsCheckbox.vue";
import ProgramEligibilityBanner from "@/components/institutions/banners/ProgramEligibilityBanner.vue";
import { YES_NO_VALUE_ITEMS } from "@/constants";

interface EditProgramProps {
  locationId: number;
  programId: number;
  backTarget: BackTarget;
}

interface EditProgramModel {
  name: string;
  description: string;
  credentialType: string;
  cipCode: string;
  fieldOfStudyCode: number;
  nocCode: string;
  sabcCode: string;
  institutionProgramCode?: string;
  programIntensity: ProgramIntensity;
  programDeliveryTypes: ProgramDeliveryTypeValues[];
  deliveredOnlineAlsoOnsite?: FormYesNoOptions;
  sameOnlineCreditsEarned?: FormYesNoOptions;
  earnAcademicCreditsOtherInstitution?: FormYesNoOptions;
  completionYears: string;
  courseLoadCalculation: ProgramCourseLoadCalculationTypes;
  minHoursWeek?: FormYesNoOptions;
  regulatoryBody: string;
  otherRegulatoryBody?: string;
  entranceRequirements: string[];
  eslEligibility: ProgramESLPercentage;
  hasJointInstitution: FormYesNoOptions;
  hasJointDesignatedInstitution?: FormYesNoOptions;
  hasWILComponent: FormYesNoOptions;
  isWILApproved?: FormYesNoOptions;
  wilProgramEligibility?: FormYesNoOptions;
  hasTravel: FormYesNoOptions;
  travelProgramEligibility?: FormYesNoOptions;
  hasIntlExchange: FormYesNoOptions;
  intlExchangeProgramEligibility?: FormYesNoOptions;
  isAviationProgram: FormYesNoOptions;
  credentialTypesAviation?: string[];
  minHoursWeekAvi?: FormYesNoOptions;
  programDeclaration: boolean;
}

interface ProgramContext {
  hasOfferings: boolean;
  isActive: boolean;
  isExpired: boolean;
}

interface InstitutionContext {
  isBCPublic: boolean;
  isBCPrivate: boolean;
  isBCInstitution: boolean;
}
const PROGRAM_INTENSITY_ITEMS: ComponentItemType[] = [
  { title: "Yes", value: ProgramIntensity.fullTimePartTime },
  { title: "No", value: ProgramIntensity.fullTime },
];
const PROGRAM_DELIVERY_ITEMS: ComponentItemType[] = [
  { title: "On site", value: ProgramDeliveryTypeValues.Onsite },
  { title: "Online", value: ProgramDeliveryTypeValues.Online },
];
const PROGRAM_COURSE_LOAD_ITEMS: ComponentItemType[] = [
  { title: "Credit based", value: ProgramCourseLoadCalculationTypes.Credit },
  { title: "Hours based", value: ProgramCourseLoadCalculationTypes.Hours },
];
const REGULATORY_BODY_OTHER = "other";
const NONE_OF_THE_ABOVE_ENTRANCE_REQUIREMENTS =
  "noneOfTheAboveEntranceRequirements";
const AVIATION_PRIVATE_PILOT_TRAINING = "privatePilotTraining";

// TODO: Convert to lookup.
const PROGRAM_LENGTH_ITEMS: ComponentItemType[] = [
  { title: "12 weeks to 52 weeks", value: "12WeeksTo52Weeks" },
  { title: "53 weeks to 59 weeks", value: "53WeeksTo59Weeks" },
  { title: "60 weeks to less than 2 years", value: "60WeeksToLessThan2Years" },
  { title: "2 Years to less than 3Years", value: "2YearsToLessThan3Years" },
  { title: "3 Years to less than 4 Years", value: "3YearsToLessThan4Years" },
  { title: "4 Years to less than 5Years", value: "4YearsToLessThan5Years" },
  { title: "5 Years or More", value: "5YearsOrMore" },
];

// TODO: Convert to lookup.
const REGULATORY_BODY_ITEMS: ComponentItemType[] = [
  { title: "PTIRU", value: "ptiru" },
  { title: "DQAB", value: "dqab" },
  { title: "Private Act of B.C. Legislature", value: "skilledTradesBC" },
  { title: "Skilled Trades BC", value: "icbc" },
  { title: "ICBC", value: "senateOrEducationCouncil" },
  {
    title:
      "Senate, Academic Council, Education Council, and/or Program Council and Board of Governors",
    value: "4YearsToLessThan5Years",
  },
  { title: "Other", value: REGULATORY_BODY_OTHER },
];

// TODO: Convert to lookup.
const ENTRANCE_REQUIREMENT_ITEMS: ComponentItemType[] = [
  {
    title: "Students to have graduated from grade 12 or equivalent.",
    value: "minHighSchool",
  },
  {
    title: "Students are 19 years old or older before the start of classes.",
    value: "hasMinimumAge",
  },
  {
    title:
      "For post-secondary level academic credit-based programs: This program has entrance requirements established by the institution that enable completion of the program of study.",
    value: "requirementsByInstitution",
  },
  {
    title:
      "This program is approved by the SkilledTradesBC and students must meet the entrance requirements set by the B.C. ITA.",
    value: "requirementsByBCITA",
  },
  {
    title: "None of the above",
    value: NONE_OF_THE_ABOVE_ENTRANCE_REQUIREMENTS,
  },
];

// TODO: Convert to lookup.
const AVIATION_CREDENTIAL_ITEMS: ComponentItemType[] = [
  { title: "Commercial Pilot Training", value: "commercialPilotTraining" },
  { title: "Instructor's Rating", value: "instructorsRating" },
  { title: "Endorsements", value: "endorsements" },
  { title: "Private Pilot Training", value: AVIATION_PRIVATE_PILOT_TRAINING },
];

const PROGRAM_ESL_ITEMS: ComponentItemType[] = [
  { title: "Less than 20%", value: ProgramESLPercentage.LessThan20 },
  { title: "20% or more", value: ProgramESLPercentage.GreaterThanEqual20 },
];
const loading = ref(false);
const snackBar = useSnackBar();
const props = defineProps<EditProgramProps>();
const router = useRouter();
const editProgramFormModel = ref<EditProgramModel>({} as EditProgramModel);
const programContext = ref<ProgramContext>();
const institutionContext = ref<InstitutionContext>();
// const canEditOnlyBasicInfo = computed(
//   () => !!program.value && !program.value.hasOfferings,
// );
// const isReadonly = computed(
//   () => !program.value || !program.value.isActive || program.value.isExpired,
// );
const {
  checkLengthRule,
  checkRegexPattern,
  checkNullOrEmptyRule,
  requiredDeclarationRule,
} = useRules();
const { convertCheckboxObjectModelToArray } = useProgram();
const editProgramForm = ref({} as VForm);
const componentDisplayConditions = computed(() => {
  return {
    showDeliveredOnlineAlsoOnsite:
      !institutionContext.value?.isBCInstitution &&
      editProgramFormModel.value.programDeliveryTypes?.includes(
        ProgramDeliveryTypeValues.Online,
      ),
    showSameOnlineCreditsEarned:
      editProgramFormModel.value.deliveredOnlineAlsoOnsite ===
      FormYesNoOptions.No,
    showAcademicCreditsOtherInstitution:
      editProgramFormModel.value.sameOnlineCreditsEarned ===
      FormYesNoOptions.No,
    showMinHoursWeek:
      editProgramFormModel.value.courseLoadCalculation ===
      ProgramCourseLoadCalculationTypes.Hours,
    showOtherRegulatoryBody:
      editProgramFormModel.value.regulatoryBody === REGULATORY_BODY_OTHER,
    showHasJointDesignatedInstitution:
      editProgramFormModel.value.hasJointInstitution === FormYesNoOptions.Yes,
    showIsWILApproved:
      editProgramFormModel.value.hasWILComponent === FormYesNoOptions.Yes,
    showWILProgramEligibility:
      editProgramFormModel.value.isWILApproved === FormYesNoOptions.Yes,
    showTravelProgramEligibility:
      editProgramFormModel.value.hasTravel === FormYesNoOptions.Yes,
    showIntlExchangeProgramEligibility:
      editProgramFormModel.value.hasIntlExchange === FormYesNoOptions.Yes,
    showAviationDetails:
      editProgramFormModel.value.isAviationProgram === FormYesNoOptions.Yes,
  };
});
const bannerDisplayConditions = computed(() => {
  return {
    showBCPrivateOnlyOnlineBanner:
      institutionContext.value?.isBCPrivate &&
      editProgramFormModel.value.programDeliveryTypes?.length === 1 &&
      editProgramFormModel.value.programDeliveryTypes[0] ===
        ProgramDeliveryTypeValues.Online,
    showNonBCInstitutionAcademicCreditsBanner:
      !institutionContext.value?.isBCInstitution &&
      editProgramFormModel.value.deliveredOnlineAlsoOnsite ===
        FormYesNoOptions.No &&
      editProgramFormModel.value.sameOnlineCreditsEarned ===
        FormYesNoOptions.No &&
      editProgramFormModel.value.earnAcademicCreditsOtherInstitution ===
        FormYesNoOptions.No,
    showLessThanMinHoursWeekBanner:
      editProgramFormModel.value.courseLoadCalculation ===
        ProgramCourseLoadCalculationTypes.Hours &&
      editProgramFormModel.value.minHoursWeek === FormYesNoOptions.No &&
      editProgramFormModel.value.isAviationProgram === FormYesNoOptions.No,
    showNoEntranceRequirementsBanner:
      editProgramFormModel.value.entranceRequirements?.length === 1 &&
      editProgramFormModel.value.entranceRequirements[0] ===
        NONE_OF_THE_ABOVE_ENTRANCE_REQUIREMENTS,
    showExceedingESLBanner:
      editProgramFormModel.value.eslEligibility ===
      ProgramESLPercentage.GreaterThanEqual20,
    showJointDesignatedInstitutionBanner:
      editProgramFormModel.value.hasJointDesignatedInstitution ===
      FormYesNoOptions.Yes,
    showJointNonDesignatedInstitutionBanner:
      editProgramFormModel.value.hasJointDesignatedInstitution ===
      FormYesNoOptions.No,
    showWILNotApprovalBanner:
      editProgramFormModel.value.isWILApproved === FormYesNoOptions.No,
    showWILEligibilityBanner:
      editProgramFormModel.value.wilProgramEligibility === FormYesNoOptions.No,
    showTravelEligibilityBanner:
      editProgramFormModel.value.travelProgramEligibility ===
      FormYesNoOptions.No,
    showIntlExchangeEligibilityBanner:
      editProgramFormModel.value.intlExchangeProgramEligibility ===
      FormYesNoOptions.No,
    showPrivatePilotTrainingBanner:
      editProgramFormModel.value.credentialTypesAviation?.includes(
        AVIATION_PRIVATE_PILOT_TRAINING,
      ),
    showAviationMinHoursWeekBanner:
      editProgramFormModel.value.minHoursWeekAvi === FormYesNoOptions.No,
  };
});
const submit = async () => {
  const { valid } = await editProgramForm.value.validate();
  if (!valid) {
    return;
  }
  console.log("Program updated:", editProgramFormModel.value);
};
const cancel = async () => {
  router.push(props.backTarget.to);
};
const loadProgram = async () => {
  try {
    loading.value = true;
    const programDetails =
      await EducationProgramService.shared.getEducationProgram(props.programId);
    editProgramFormModel.value = {
      name: programDetails.name,
      description: programDetails.description,
      credentialType: programDetails.credentialType,
      cipCode: programDetails.cipCode,
      fieldOfStudyCode: programDetails.fieldOfStudyCode,
      nocCode: programDetails.nocCode,
      sabcCode: programDetails.sabcCode,
      institutionProgramCode: programDetails.institutionProgramCode,
      programIntensity: programDetails.programIntensity,
      programDeliveryTypes: convertCheckboxObjectModelToArray(
        programDetails.programDeliveryTypes,
      ),
      deliveredOnlineAlsoOnsite:
        programDetails.deliveredOnlineAlsoOnsite as FormYesNoOptions,
      sameOnlineCreditsEarned:
        programDetails.sameOnlineCreditsEarned as FormYesNoOptions,
      earnAcademicCreditsOtherInstitution:
        programDetails.earnAcademicCreditsOtherInstitution as FormYesNoOptions,
      completionYears: programDetails.completionYears,
      courseLoadCalculation:
        programDetails.courseLoadCalculation as ProgramCourseLoadCalculationTypes,
      minHoursWeek: programDetails.minHoursWeek as FormYesNoOptions,
      regulatoryBody: programDetails.regulatoryBody,
      otherRegulatoryBody: programDetails.otherRegulatoryBody,
      entranceRequirements: convertCheckboxObjectModelToArray(
        programDetails.entranceRequirements,
      ),
      eslEligibility: programDetails.eslEligibility as ProgramESLPercentage,
      hasJointInstitution:
        programDetails.hasJointInstitution as FormYesNoOptions,
      hasJointDesignatedInstitution:
        programDetails.hasJointDesignatedInstitution as FormYesNoOptions,
      hasWILComponent: programDetails.hasWILComponent as FormYesNoOptions,
      isWILApproved: programDetails.isWILApproved as FormYesNoOptions,
      wilProgramEligibility:
        programDetails.wilProgramEligibility as FormYesNoOptions,
      hasTravel: programDetails.hasTravel as FormYesNoOptions,
      travelProgramEligibility:
        programDetails.travelProgramEligibility as FormYesNoOptions,
      hasIntlExchange: programDetails.hasIntlExchange as FormYesNoOptions,
      intlExchangeProgramEligibility:
        programDetails.intlExchangeProgramEligibility as FormYesNoOptions,
      isAviationProgram: programDetails.isAviationProgram as FormYesNoOptions,
      credentialTypesAviation: convertCheckboxObjectModelToArray(
        programDetails.credentialTypesAviation,
      ),
      minHoursWeekAvi: programDetails.minHoursWeekAvi as FormYesNoOptions,
      programDeclaration: programDetails.programDeclaration,
    };
    programContext.value = {
      hasOfferings: programDetails.hasOfferings,
      isActive: programDetails.isActive,
      isExpired: programDetails.isExpired,
    };
    institutionContext.value = {
      isBCPrivate: programDetails.isBCPrivate,
      isBCPublic: programDetails.isBCPublic,
      isBCInstitution: programDetails.isBCPrivate || programDetails.isBCPublic,
    };
  } catch {
    snackBar.error("Unexpected error while loading program data.");
  } finally {
    loading.value = false;
  }
};
watchEffect(async () => {
  await loadProgram();
});
</script>
