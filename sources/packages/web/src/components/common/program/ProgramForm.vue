<template>
  <body-header-container title="Program"
    ><content-group>
      <error-summary :errors="programForm.errors" />
      <v-skeleton-loader :loading="loading" type="article, text@5">
        <v-form ref="programForm" :readonly="isReadonly">
          <body-header-container title="Program details" header-size="medium">
            <content-group>
              <v-text-field
                v-model="formModel.name"
                density="compact"
                label="Program name"
                variant="outlined"
                :rules="[
                  (v) =>
                    checkLengthRule(v, PROGRAM_NAME_MAX_LENGTH, 'Program name'),
                ]"
              />
              <v-textarea
                v-model="formModel.description"
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
                v-model="formModel.cipCode"
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
                :readonly="canEditOnlyBasicInfo"
              />
              <v-text-field
                :model-value="formModel.fieldOfStudyCode"
                density="compact"
                label="Field of study code"
                variant="outlined"
                readonly
              />
              <v-text-field
                v-model="formModel.nocCode"
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
                :readonly="canEditOnlyBasicInfo"
              />
              <v-text-field
                v-model="formModel.sabcCode"
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
                :readonly="canEditOnlyBasicInfo"
              />
              <v-text-field
                v-model="formModel.institutionProgramCode"
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
                :readonly="canEditOnlyBasicInfo"
              /> </content-group
          ></body-header-container>
          <body-header-container
            title="Program eligibility"
            header-size="medium"
          >
            <content-group>
              <option-items-radio
                v-model="formModel.programIntensity"
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
                :readonly="canEditOnlyBasicInfo"
              ></option-items-radio>
              <option-items-checkbox
                v-model="formModel.programDeliveryTypes"
                color="primary"
                label="How will this program be delivered? (Select all that apply)"
                :items="PROGRAM_DELIVERY_ITEMS"
                :rules="[
                  (v) =>
                    v.length > 0 ||
                    'At least one program delivery type must be selected.',
                ]"
                :readonly="canEditOnlyBasicInfo"
              ></option-items-checkbox>
              <program-eligibility-banner
                v-if="bannerDisplayConditions.showBCPrivateOnlyOnlineBanner"
                header="This program requires review by StudentAid BC to determine eligibility."
              />
              <option-items-radio
                v-if="componentDisplayConditions.deliveredOnlineAlsoOnsite"
                v-model="formModel.deliveredOnlineAlsoOnsite"
                color="primary"
                label="Will the program also be offered and delivered at 100% course load on site?"
                :items="YES_NO_VALUE_ITEMS"
                :readonly="canEditOnlyBasicInfo"
              ></option-items-radio>
              <option-items-radio
                v-if="componentDisplayConditions.sameOnlineCreditsEarned"
                v-model="formModel.sameOnlineCreditsEarned"
                color="primary"
                label="Will the students earn the same number of credits in the same time period as students in other StudentAid BC eligible programs delivered on site?"
                :items="YES_NO_VALUE_ITEMS"
                :readonly="canEditOnlyBasicInfo"
              ></option-items-radio>
              <option-items-radio
                v-if="
                  componentDisplayConditions.earnAcademicCreditsOtherInstitution
                "
                v-model="formModel.earnAcademicCreditsOtherInstitution"
                color="primary"
                label="Will they earn academic credits that are recognized at another designated institution listed in the BC Transfer Guide or other acceptable articulation agreements from other jurisdictions?"
                :items="YES_NO_VALUE_ITEMS"
                :readonly="canEditOnlyBasicInfo"
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
                v-model="formModel.completionYears"
                variant="outlined"
                hide-details="auto"
                :rules="[(v) => checkNullOrEmptyRule(v, 'Program length')]"
                :readonly="canEditOnlyBasicInfo"
              />
              <option-items-radio
                v-model="formModel.courseLoadCalculation"
                color="primary"
                label="Program course load calculation is:"
                :items="PROGRAM_COURSE_LOAD_ITEMS"
                :rules="[
                  (v: string) =>
                    checkNullOrEmptyRule(v, 'Program course load calculation:'),
                ]"
                :readonly="canEditOnlyBasicInfo"
              ></option-items-radio>
              <option-items-radio
                v-if="componentDisplayConditions.minHoursWeek"
                v-model="formModel.minHoursWeek"
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
                :readonly="canEditOnlyBasicInfo"
              ></option-items-radio>
              <program-eligibility-banner
                v-if="bannerDisplayConditions.showLessThanMinHoursWeekBanner"
                summary="The program needs to be a minimum of 20 instructional hours."
              />
              <v-select
                label="Which regulatory body does this program belong to?"
                density="compact"
                :items="REGULATORY_BODY_ITEMS"
                v-model="formModel.regulatoryBody"
                variant="outlined"
                :rules="[
                  (v) =>
                    checkNullOrEmptyRule(
                      v,
                      'Which regulatory body does this program belong to?',
                    ),
                ]"
                :readonly="canEditOnlyBasicInfo"
              />
              <v-text-field
                v-if="componentDisplayConditions.otherRegulatoryBody"
                v-model="formModel.otherRegulatoryBody"
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
                :readonly="canEditOnlyBasicInfo"
              />
            </content-group>
          </body-header-container>
          <body-header-container
            title="Entrance requirements"
            header-size="medium"
          >
            <content-group>
              <option-items-checkbox
                v-model="formModel.entranceRequirements"
                @update:model-value="updateEntranceRequirements"
                color="primary"
                label="What are the entrance requirements for this program? (Select all that apply)"
                :items="ENTRANCE_REQUIREMENT_ITEMS"
                :rules="[
                  (v) =>
                    v.length > 0 ||
                    'At least one entrance requirement must be selected.',
                ]"
                :readonly="canEditOnlyBasicInfo"
              ></option-items-checkbox>
              <program-eligibility-banner
                v-if="bannerDisplayConditions.showNoEntranceRequirementsBanner"
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
                v-model="formModel.eslEligibility"
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
                :readonly="canEditOnlyBasicInfo"
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
                v-model="formModel.hasJointInstitution"
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
                :readonly="canEditOnlyBasicInfo"
              ></option-items-radio>
              <option-items-radio
                v-if="componentDisplayConditions.hasJointDesignatedInstitution"
                v-model="formModel.hasJointDesignatedInstitution"
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
                :readonly="canEditOnlyBasicInfo"
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
                v-model="formModel.hasWILComponent"
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
                :readonly="canEditOnlyBasicInfo"
              ></option-items-radio>
              <option-items-radio
                v-if="componentDisplayConditions.isWILApproved"
                v-model="formModel.isWILApproved"
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
                :readonly="canEditOnlyBasicInfo"
              ></option-items-radio>
              <program-eligibility-banner
                v-if="bannerDisplayConditions.showWILNotApprovalBanner"
                summary="The work-integrated learning component must be approved by your regulator or oversight body first."
              />
              <option-items-radio
                v-if="componentDisplayConditions.wilProgramEligibility"
                v-model="formModel.wilProgramEligibility"
                color="primary"
                label="Does the WIL meet the program eligibility requirements according to StudentAid BC policy?"
                :items="YES_NO_VALUE_ITEMS"
                :readonly="canEditOnlyBasicInfo"
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
                v-model="formModel.hasTravel"
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
                :readonly="canEditOnlyBasicInfo"
              ></option-items-radio>
              <option-items-radio
                v-if="componentDisplayConditions.travelProgramEligibility"
                v-model="formModel.travelProgramEligibility"
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
                :readonly="canEditOnlyBasicInfo"
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
                v-model="formModel.hasIntlExchange"
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
                :readonly="canEditOnlyBasicInfo"
              ></option-items-radio>
              <option-items-radio
                v-if="componentDisplayConditions.intlExchangeProgramEligibility"
                v-model="formModel.intlExchangeProgramEligibility"
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
                :readonly="canEditOnlyBasicInfo"
              ></option-items-radio>
            </content-group>
          </body-header-container>
          <body-header-container title="Aviation" header-size="medium">
            <content-group>
              <option-items-radio
                v-model="formModel.isAviationProgram"
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
                :readonly="canEditOnlyBasicInfo"
              ></option-items-radio>
              <option-items-checkbox
                v-if="componentDisplayConditions.credentialTypesAviation"
                v-model="formModel.credentialTypesAviation"
                color="primary"
                label="Which credential type(s) are included? (Select all that apply)"
                :items="AVIATION_CREDENTIAL_ITEMS"
                :rules="[
                  (v) =>
                    v.length > 0 ||
                    'At least one credential type must be selected.',
                ]"
                :readonly="canEditOnlyBasicInfo"
              ></option-items-checkbox>
              <option-items-radio
                v-if="componentDisplayConditions.minHoursWeekAvi"
                v-model="formModel.minHoursWeekAvi"
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
                :readonly="canEditOnlyBasicInfo"
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
                v-model="formModel.programDeclaration"
                hide-details="auto"
                :rules="[requiredDeclarationRule]"
                :readonly="canEditOnlyBasicInfo"
              />
            </content-group>
          </body-header-container>
        </v-form>
      </v-skeleton-loader>
    </content-group>
    <footer-buttons
      primary-label="Update"
      @secondary-click="$emit('cancel')"
      @primary-click="submit"
      :disable-primary-button="loading"
      v-if="!isReadonly"
    />
  </body-header-container>
</template>
<script setup lang="ts">
import { useProgram, useRules, useSnackBar } from "@/composables";
import {
  PROGRAM_NAME_MAX_LENGTH,
  PROGRAM_DESCRIPTION_MAX_LENGTH,
  INSTITUTION_PROGRAM_CODE_MAX_LENGTH,
  OTHER_REGULATORY_BODY_MAX_LENGTH,
} from "@/constants/program-constants";
import { computed, ref, watch, watchEffect } from "vue";
import type { ComponentItemType, VForm, ProgramFormModel } from "@/types";
import {
  FormYesNoOptions,
  ProgramIntensity,
  ProgramCourseLoadCalculationTypes,
  ProgramDeliveryTypeValues,
  ProgramESLPercentage,
} from "@/types";
import { EducationProgramService } from "@/services/EducationProgramService";
import OptionItemsRadio from "@/components/generic/OptionItemsRadio.vue";
import OptionItemsCheckbox from "@/components/generic/OptionItemsCheckbox.vue";
import ProgramEligibilityBanner from "@/components/institutions/banners/ProgramEligibilityBanner.vue";
import { YES_NO_VALUE_ITEMS } from "@/constants";
import { EducationProgramAPIOutDTO } from "@/services/http/dto";

interface ProgramFormProps {
  programId?: number;
  isBCPublic?: boolean;
  isBCPrivate?: boolean;
  readOnly?: boolean;
}

interface ProgramFormContext {
  hasOfferings: boolean;
  isActive: boolean;
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
const props = withDefaults(defineProps<ProgramFormProps>(), {
  programId: undefined,
  isBCPublic: undefined,
  isBCPrivate: undefined,
  readOnly: true,
});
const emit = defineEmits<{
  cancel: [];
  submitted: [program: ProgramFormModel];
  loaded: [program: EducationProgramAPIOutDTO];
}>();
const formModel = ref<ProgramFormModel>({} as ProgramFormModel);
const formContext = ref<ProgramFormContext>();
const canEditOnlyBasicInfo = computed(
  () => props.readOnly || formContext.value?.hasOfferings,
);
const isReadonly = computed(
  () => props.readOnly || !formContext.value?.isActive,
);
const {
  checkLengthRule,
  checkRegexPattern,
  checkNullOrEmptyRule,
  requiredDeclarationRule,
} = useRules();
const { convertCheckboxObjectModelToArray } = useProgram();
const programForm = ref({} as VForm);
let previousEntranceRequirements: string[] = [];

// Ensure that the form model key is same as display condition key.
// This will ensure that the form model value is reset when the component is hidden.
const componentDisplayConditions = computed(() => {
  const canShowAviationDetails =
    formModel.value.isAviationProgram === FormYesNoOptions.Yes;
  return {
    deliveredOnlineAlsoOnsite:
      !formContext.value?.isBCInstitution &&
      formModel.value.programDeliveryTypes?.includes(
        ProgramDeliveryTypeValues.Online,
      ),
    sameOnlineCreditsEarned:
      formModel.value.deliveredOnlineAlsoOnsite === FormYesNoOptions.No,
    earnAcademicCreditsOtherInstitution:
      formModel.value.sameOnlineCreditsEarned === FormYesNoOptions.No,
    minHoursWeek:
      formModel.value.courseLoadCalculation ===
      ProgramCourseLoadCalculationTypes.Hours,
    otherRegulatoryBody:
      formModel.value.regulatoryBody === REGULATORY_BODY_OTHER,
    hasJointDesignatedInstitution:
      formModel.value.hasJointInstitution === FormYesNoOptions.Yes,
    isWILApproved: formModel.value.hasWILComponent === FormYesNoOptions.Yes,
    wilProgramEligibility:
      formModel.value.isWILApproved === FormYesNoOptions.Yes,
    travelProgramEligibility:
      formModel.value.hasTravel === FormYesNoOptions.Yes,
    intlExchangeProgramEligibility:
      formModel.value.hasIntlExchange === FormYesNoOptions.Yes,
    minHoursWeekAvi: canShowAviationDetails,
    credentialTypesAviation: canShowAviationDetails,
  };
});
const bannerDisplayConditions = computed(() => ({
  showBCPrivateOnlyOnlineBanner:
    formContext.value?.isBCPrivate &&
    formModel.value.programDeliveryTypes?.length === 1 &&
    formModel.value.programDeliveryTypes[0] ===
      ProgramDeliveryTypeValues.Online,
  showNonBCInstitutionAcademicCreditsBanner:
    !formContext.value?.isBCInstitution &&
    formModel.value.deliveredOnlineAlsoOnsite === FormYesNoOptions.No &&
    formModel.value.sameOnlineCreditsEarned === FormYesNoOptions.No &&
    formModel.value.earnAcademicCreditsOtherInstitution === FormYesNoOptions.No,
  showLessThanMinHoursWeekBanner:
    formModel.value.courseLoadCalculation ===
      ProgramCourseLoadCalculationTypes.Hours &&
    formModel.value.minHoursWeek === FormYesNoOptions.No &&
    formModel.value.isAviationProgram === FormYesNoOptions.No,
  showNoEntranceRequirementsBanner:
    formModel.value.entranceRequirements?.length === 1 &&
    formModel.value.entranceRequirements[0] ===
      NONE_OF_THE_ABOVE_ENTRANCE_REQUIREMENTS,
  showExceedingESLBanner:
    formModel.value.eslEligibility === ProgramESLPercentage.GreaterThanEqual20,
  showJointDesignatedInstitutionBanner:
    formModel.value.hasJointDesignatedInstitution === FormYesNoOptions.Yes,
  showJointNonDesignatedInstitutionBanner:
    formModel.value.hasJointDesignatedInstitution === FormYesNoOptions.No,
  showWILNotApprovalBanner:
    formModel.value.isWILApproved === FormYesNoOptions.No,
  showWILEligibilityBanner:
    formModel.value.wilProgramEligibility === FormYesNoOptions.No,
  showTravelEligibilityBanner:
    formModel.value.travelProgramEligibility === FormYesNoOptions.No,
  showIntlExchangeEligibilityBanner:
    formModel.value.intlExchangeProgramEligibility === FormYesNoOptions.No,
  showPrivatePilotTrainingBanner:
    formModel.value.credentialTypesAviation?.includes(
      AVIATION_PRIVATE_PILOT_TRAINING,
    ),
  showAviationMinHoursWeekBanner:
    formModel.value.minHoursWeekAvi === FormYesNoOptions.No,
}));
const submit = async () => {
  const { valid } = await programForm.value.validate();
  if (!valid) {
    return;
  }
  emit("submitted", formModel.value);
};
const updateEntranceRequirements = () => {
  const currentEntranceRequirements = formModel.value.entranceRequirements;
  if (!currentEntranceRequirements.length) {
    previousEntranceRequirements = [];
    return;
  }
  const isNonePreviouslySelected =
    previousEntranceRequirements[0] === NONE_OF_THE_ABOVE_ENTRANCE_REQUIREMENTS;
  if (isNonePreviouslySelected) {
    formModel.value.entranceRequirements = currentEntranceRequirements.filter(
      (requirement) => requirement !== NONE_OF_THE_ABOVE_ENTRANCE_REQUIREMENTS,
    );
  } else {
    formModel.value.entranceRequirements = currentEntranceRequirements.includes(
      NONE_OF_THE_ABOVE_ENTRANCE_REQUIREMENTS,
    )
      ? [NONE_OF_THE_ABOVE_ENTRANCE_REQUIREMENTS]
      : currentEntranceRequirements;
  }
  previousEntranceRequirements = formModel.value.entranceRequirements;
};
const loadProgram = async (programId: number) => {
  try {
    loading.value = true;
    const programDetails =
      await EducationProgramService.shared.getEducationProgram(programId);
    formModel.value = {
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
    formContext.value = {
      hasOfferings: programDetails.hasOfferings,
      isActive: programDetails.isActive && !programDetails.isExpired,
      isBCPrivate: programDetails.isBCPrivate,
      isBCPublic: programDetails.isBCPublic,
      isBCInstitution: programDetails.isBCPrivate || programDetails.isBCPublic,
    };
    previousEntranceRequirements = formModel.value.entranceRequirements;
    emit("loaded", programDetails);
  } catch {
    snackBar.error("Unexpected error while loading program data.");
  } finally {
    loading.value = false;
  }
};
watchEffect(async () => {
  if (props.programId) {
    await loadProgram(props.programId);
  } else {
    // When the program ID is not provided, some of the form context values are required to initialize the form.
    formContext.value = {
      isBCPublic: props.isBCPublic,
      isBCPrivate: props.isBCPrivate,
      isBCInstitution: props.isBCPrivate || props.isBCPublic,
    } as ProgramFormContext;
  }
});
watch(
  componentDisplayConditions,
  (conditions) => {
    Object.entries(conditions).forEach(([key, value]) => {
      if (!value && formModel.value[key] !== undefined) {
        // Reset the form model value when the component is hidden.
        formModel.value[key] = undefined;
      }
    });
  },
  { immediate: true },
);
</script>
