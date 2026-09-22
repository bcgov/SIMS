<template>
  <body-header-container title="Program"
    ><content-group>
      <error-summary :errors="programForm?.errors" />
      <v-skeleton-loader :loading="loading" type="article, text@5">
        <v-form ref="programForm" :readonly="isReadonly">
          <body-header-container title="Program details" header-size="medium">
            <content-group>
              <v-text-field
                v-model="formModel.name"
                density="compact"
                label="Program name"
                variant="outlined"
                :counter="PROGRAM_NAME_MAX_LENGTH"
                :rules="[
                  (v) =>
                    checkLengthRule(v, PROGRAM_NAME_MAX_LENGTH, 'Program name'),
                ]"
              />
              <v-textarea
                v-model="formModel.description"
                variant="outlined"
                label="Program description"
                :counter="PROGRAM_DESCRIPTION_MAX_LENGTH"
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
              <v-select
                label="Credential type"
                density="compact"
                :items="programCredentialLookupItems"
                item-title="lookupValue"
                item-value="lookupKey"
                v-model="formModel.credentialType"
                variant="outlined"
                :rules="[(v) => checkNullOrEmptyRule(v, 'Credential type')]"
                :readonly="isProgramDetailReadonly"
                @update:model-value="calculateFieldOfStudyCode"
              />
              <v-text-field
                class="mb-3"
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
                      CIP_CODE_REGEX,
                      'Classification of Instructional Programs (CIP)',
                    ),
                ]"
                :readonly="isProgramDetailReadonly"
                @update:model-value="calculateFieldOfStudyCode"
              />
              <v-text-field
                :model-value="formModel.fieldOfStudyCode"
                density="compact"
                label="Field of study code"
                variant="outlined"
                readonly
              />
              <v-text-field
                class="mb-3"
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
                      NOC_REGEX,
                      'National Occupational Classification (NOC)',
                      false,
                    ),
                ]"
                :readonly="isProgramDetailReadonly"
              />
              <v-text-field
                class="mb-3"
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
                      SABC_PROGRAM_CODE_REGEX,
                      'SABC program code',
                      false,
                    ),
                ]"
                :readonly="isProgramDetailReadonly"
              />
              <v-text-field
                v-model="formModel.institutionProgramCode"
                density="compact"
                :counter="INSTITUTION_PROGRAM_CODE_MAX_LENGTH"
                label="Institution Program Code"
                hide-details="auto"
                variant="outlined"
                :rules="[
                  (v) =>
                    checkLengthRule(
                      v,
                      INSTITUTION_PROGRAM_CODE_MAX_LENGTH,
                      'Institution Program Code',
                      false,
                    ),
                ]"
                :readonly="isProgramDetailReadonly"
              /> </content-group
          ></body-header-container>
          <body-header-container
            title="Program eligibility"
            header-size="medium"
          >
            <content-group>
              <radio-options-group
                v-model="formModel.programIntensity"
                :items="PROGRAM_INTENSITY_ITEMS"
                :rules="[
                  (v: string) =>
                    checkNullOrEmptyRule(
                      v,
                      'Are students able to take this on a part time basis?',
                    ),
                ]"
                :readonly="isProgramDetailReadonly"
                ><template #label>
                  <span
                    >Are students able to take this on a part time basis?</span
                  ><tooltip-icon :max-width="tooltipMaxWidth"
                    >A part-time program has a course load between 20 and 59%. A
                    full-time program must have a course load of: 60% or greater
                    or Between 40 and 60% for students with a permanent
                    disability.</tooltip-icon
                  ></template
                ></radio-options-group
              >
              <checkbox-options-group
                color="primary"
                v-model="formModel.programDeliveryTypes"
                label="How will this program be delivered? (Select all that apply)"
                :items="PROGRAM_DELIVERY_ITEMS"
                item-value="value"
                item-title="title"
                :rules="[
                  (v) =>
                    v.length > 0 ||
                    'At least one program delivery type must be selected.',
                ]"
                :readonly="isProgramDetailReadonly"
              ></checkbox-options-group>
              <program-eligibility-banner
                v-if="bannerDisplayConditions.showBCPrivateOnlyOnlineBanner"
                header="This program requires review by StudentAid BC to determine eligibility."
              />
              <radio-options-yes-no
                v-if="componentDisplayConditions.deliveredOnlineAlsoOnsite"
                v-model="formModel.deliveredOnlineAlsoOnsite"
                label="Will the program also be offered and delivered at 100% course load on site?"
                :readonly="isProgramDetailReadonly"
                :rules="[
                  (v: string) =>
                    checkNullOrEmptyRule(
                      v,
                      'Will the program also be offered and delivered at 100% course load on site?',
                    ),
                ]"
              ></radio-options-yes-no>
              <radio-options-yes-no
                v-if="componentDisplayConditions.sameOnlineCreditsEarned"
                v-model="formModel.sameOnlineCreditsEarned"
                label="Will the students earn the same number of credits in the same time period as students in other StudentAid BC eligible programs delivered on site?"
                :readonly="isProgramDetailReadonly"
                :rules="[
                  (v: string) =>
                    checkNullOrEmptyRule(
                      v,
                      'Will the students earn the same number of credits in the same time period as students in other StudentAid BC eligible programs delivered on site?',
                    ),
                ]"
              ></radio-options-yes-no>
              <radio-options-yes-no
                v-if="
                  componentDisplayConditions.earnAcademicCreditsOtherInstitution
                "
                v-model="formModel.earnAcademicCreditsOtherInstitution"
                label="Will they earn academic credits that are recognized at another designated institution listed in the BC Transfer Guide or other acceptable articulation agreements from other jurisdictions?"
                :readonly="isProgramDetailReadonly"
                :rules="[
                  (v: string) =>
                    checkNullOrEmptyRule(
                      v,
                      'Will they earn academic credits that are recognized at another designated institution listed in the BC Transfer Guide or other acceptable articulation agreements from other jurisdictions?',
                    ),
                ]"
              ></radio-options-yes-no>
              <program-eligibility-banner
                v-if="
                  bannerDisplayConditions.showNonBCInstitutionAcademicCreditsBanner
                "
              />
              <v-select
                class="mb-2"
                label="Program length"
                density="compact"
                :items="programLengthLookupItems"
                item-title="lookupValue"
                item-value="lookupKey"
                v-model="formModel.completionYears"
                variant="outlined"
                hide-details="auto"
                :rules="[(v) => checkNullOrEmptyRule(v, 'Program length')]"
                :readonly="isProgramDetailReadonly"
                hint="This qualifies students for specific funds or grants."
                persistent-hint
              />
              <radio-options-group
                v-model="formModel.courseLoadCalculation"
                label="Program course load calculation is:"
                :items="PROGRAM_COURSE_LOAD_ITEMS"
                :rules="[
                  (v: string) =>
                    checkNullOrEmptyRule(v, 'Program course load calculation:'),
                ]"
                :readonly="isProgramDetailReadonly"
              ></radio-options-group>
              <radio-options-yes-no
                v-if="componentDisplayConditions.minHoursWeek"
                v-model="formModel.minHoursWeek"
                label="Does this program include a minimum of 20 instructional hours per week?"
                :rules="[
                  (v: string) =>
                    checkNullOrEmptyRule(
                      v,
                      'Does this program include a minimum of 20 instructional hours per week?',
                    ),
                ]"
                :readonly="isProgramDetailReadonly"
              ></radio-options-yes-no>
              <program-eligibility-banner
                v-if="bannerDisplayConditions.showLessThanMinHoursWeekBanner"
                summary="The program needs to be a minimum of 20 instructional hours."
              />
              <v-select
                label="Which regulatory body does this program belong to?"
                density="compact"
                :items="institutionRegulatoryBodyLookupItems"
                item-title="lookupValue"
                item-value="lookupKey"
                v-model="formModel.regulatoryBody"
                variant="outlined"
                :rules="[
                  (v) =>
                    checkNullOrEmptyRule(
                      v,
                      'Which regulatory body does this program belong to?',
                    ),
                ]"
                :readonly="isProgramDetailReadonly"
                hint="All programs must be approved by your regulatory body to meet the criteria. If your program has not been approved yet, please contact your regulatory body first."
                persistent-hint
              />
              <v-text-field
                class="mt-3"
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
                :readonly="isProgramDetailReadonly"
              />
            </content-group>
          </body-header-container>
          <body-header-container
            title="Entrance requirements"
            header-size="medium"
          >
            <content-group>
              <checkbox-options-group
                color="primary"
                v-model="formModel.entranceRequirements"
                @update:model-value="updateEntranceRequirements"
                label="What are the entrance requirements for this program? (Select all that apply)"
                :items="programEntranceRequirementLookupItems"
                item-value="lookupKey"
                item-title="lookupValue"
                :rules="[
                  (v) =>
                    v.length > 0 ||
                    'At least one entrance requirement must be selected.',
                ]"
                :readonly="isProgramDetailReadonly"
                hide-details="auto"
              ></checkbox-options-group>
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
              <radio-options-group
                v-model="formModel.eslEligibility"
                label="What percentage of the program has ESL Content?"
                :items="PROGRAM_ESL_ITEMS"
                :rules="[
                  (v: string) =>
                    checkNullOrEmptyRule(
                      v,
                      'What percentage of the program has ESL Content?',
                    ),
                ]"
                :readonly="isProgramDetailReadonly"
                hide-details="auto"
              ></radio-options-group>
              <program-eligibility-banner
                v-if="bannerDisplayConditions.showExceedingESLBanner"
                summary="ESL can't exceed 20% of course content."
              />
            </content-group>
          </body-header-container>
          <body-header-container header-size="medium">
            <template #header
              ><body-header title="Program partnerships" header-size="medium">
                <template #subtitle>
                  <span>
                    If this program is offered at a partner institution, that
                    institution must also be designated by SABC. Find out which
                    institutions are designated on
                    <a
                      href="https://studentaidbc.ca/"
                      target="_blank"
                      rel="noopener noreferrer"
                      >StudentAidBC.ca</a
                    >.
                  </span>
                </template></body-header
              ></template
            >
            <content-group>
              <radio-options-yes-no
                v-model="formModel.hasJointInstitution"
                label="Is the program offered jointly or in partnership with other institutions?"
                :rules="[
                  (v: string) =>
                    checkNullOrEmptyRule(
                      v,
                      'Is the program offered jointly or in partnership with other institutions?',
                    ),
                ]"
                :readonly="isProgramDetailReadonly"
              ></radio-options-yes-no>
              <radio-options-yes-no
                v-if="componentDisplayConditions.hasJointDesignatedInstitution"
                v-model="formModel.hasJointDesignatedInstitution"
                label="Are all institutions you partner with for this program designated by StudentAid BC?"
                :rules="[
                  (v: string) =>
                    checkNullOrEmptyRule(
                      v,
                      'Are all institutions you partner with for this program designated by StudentAid BC?',
                    ),
                ]"
                :readonly="isProgramDetailReadonly"
              ></radio-options-yes-no>
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
              <radio-options-yes-no
                v-model="formModel.hasWILComponent"
                label="Does this program have a WIL component?"
                :rules="[
                  (v: string) =>
                    checkNullOrEmptyRule(
                      v,
                      'Does this program have a WIL component?',
                    ),
                ]"
                :readonly="isProgramDetailReadonly"
              ></radio-options-yes-no>
              <radio-options-yes-no
                v-if="componentDisplayConditions.isWILApproved"
                v-model="formModel.isWILApproved"
                label="Is the WIL approved by your regulator or oversight body?"
                :rules="[
                  (v: string) =>
                    checkNullOrEmptyRule(
                      v,
                      'Is the WIL approved by your regulator or oversight body?',
                    ),
                ]"
                :readonly="isProgramDetailReadonly"
              ></radio-options-yes-no>
              <program-eligibility-banner
                v-if="bannerDisplayConditions.showWILNotApprovalBanner"
                summary="The work-integrated learning component must be approved by your regulator or oversight body first."
              />
              <radio-options-yes-no
                v-if="componentDisplayConditions.wilProgramEligibility"
                v-model="formModel.wilProgramEligibility"
                label="Does the WIL meet the program eligibility requirements according to StudentAid BC policy?"
                :readonly="isProgramDetailReadonly"
                :rules="[
                  (v: string) =>
                    checkNullOrEmptyRule(
                      v,
                      'Does the WIL meet the program eligibility requirements according to StudentAid BC policy?',
                    ),
                ]"
                ><template #label
                  ><span
                    >Does the WIL meet the program eligibility requirements
                    according to StudentAid BC policy?</span
                  ><tooltip-icon :max-width="tooltipMaxWidth"
                    ><span
                      >For the work-integrated learning experience to qualify
                      for student financial assistance it must be:</span
                    >
                    <ul class="ps-3">
                      <li>
                        Required for graduation (in the case of a co-op
                        education placement it must either be required for
                        graduation and/or result in a credential with a co-op
                        designation);
                      </li>
                      <li>Linked to the curriculum; and</li>
                      <li>
                        Not exceed 50% of the program (or no more than 20% for
                        practicums and 10% for preceptorships) unless otherwise
                        regulated as a requirement by an oversight body (e.g.,
                        Early Childhood Educators (ECE) Registry).
                      </li>
                    </ul></tooltip-icon
                  ></template
                >></radio-options-yes-no
              >
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
              <radio-options-yes-no
                v-model="formModel.hasTravel"
                label="Is a field trip, field placement or travel part of this program?"
                :rules="[
                  (v: string) =>
                    checkNullOrEmptyRule(
                      v,
                      'Is a field trip, field placement or travel part of this program?',
                    ),
                ]"
                :readonly="isProgramDetailReadonly"
              ></radio-options-yes-no>
              <radio-options-yes-no
                v-if="componentDisplayConditions.travelProgramEligibility"
                v-model="formModel.travelProgramEligibility"
                label="Does the field trip, field placement, or travel meet the program eligibility requirements according to StudentAid BC policy?"
                :rules="[
                  (v: string) =>
                    checkNullOrEmptyRule(
                      v,
                      'Does the field trip, field placement, or travel meet the program eligibility requirements according to StudentAid BC policy?',
                    ),
                ]"
                :readonly="isProgramDetailReadonly"
              ></radio-options-yes-no>
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
              <radio-options-yes-no
                v-model="formModel.hasIntlExchange"
                label="Does the program have an international exchange?"
                :rules="[
                  (v: string) =>
                    checkNullOrEmptyRule(
                      v,
                      'Does the program have an international exchange?',
                    ),
                ]"
                :readonly="isProgramDetailReadonly"
              ></radio-options-yes-no>
              <radio-options-yes-no
                v-if="componentDisplayConditions.intlExchangeProgramEligibility"
                v-model="formModel.intlExchangeProgramEligibility"
                label="Does the international exchange meet the program eligibility requirements according to StudentAid BC policy?"
                :rules="[
                  (v: string) =>
                    checkNullOrEmptyRule(
                      v,
                      'Does the international exchange meet the program eligibility requirements according to StudentAid BC policy?',
                    ),
                ]"
                :readonly="isProgramDetailReadonly"
              ></radio-options-yes-no>
              <program-eligibility-banner
                v-if="bannerDisplayConditions.showIntlExchangeEligibilityBanner"
                summary="This must meet the StudentAid BC policy."
              />
            </content-group>
          </body-header-container>
          <body-header-container title="Aviation" header-size="medium">
            <content-group>
              <radio-options-yes-no
                v-model="formModel.isAviationProgram"
                label="Does this program contain aviation?"
                :rules="[
                  (v: string) =>
                    checkNullOrEmptyRule(
                      v,
                      'Does this program contain aviation?',
                    ),
                ]"
                :readonly="isProgramDetailReadonly"
              ></radio-options-yes-no>
              <checkbox-options-group
                color="primary"
                v-if="componentDisplayConditions.credentialTypesAviation"
                v-model="formModel.credentialTypesAviation"
                label="Which credential type(s) are included? (Select all that apply)"
                :items="programAviationCredentialLookupItems"
                item-title="lookupValue"
                item-value="lookupKey"
                :rules="[
                  (v) =>
                    v?.length > 0 ||
                    'At least one credential type must be selected.',
                ]"
                :readonly="isProgramDetailReadonly"
              ></checkbox-options-group>
              <program-eligibility-banner
                v-if="bannerDisplayConditions.showPrivatePilotTrainingBanner"
                summary="StudentAid BC does not provide any assistance to students for Private Pilot Training."
              />
              <radio-options-yes-no
                v-if="componentDisplayConditions.minHoursWeekAvi"
                v-model="formModel.minHoursWeekAvi"
                label="Does this program include a minimum of 15 instructional hours per week?"
                :rules="[
                  (v: string) =>
                    checkNullOrEmptyRule(
                      v,
                      'Does this program include a minimum of 15 instructional hours per week?',
                    ),
                ]"
                :readonly="isProgramDetailReadonly"
              ></radio-options-yes-no>
              <program-eligibility-banner
                v-if="bannerDisplayConditions.showAviationMinHoursWeekBanner"
                summary="The aviation program needs to be a minimum of 15 instructional hours."
              />
            </content-group>
          </body-header-container>
          <body-header-container title="Declaration" header-size="medium">
            <content-group>
              <p class="category-header-medium-small primary-color">
                All information is subject to verification and auditing.
              </p>
              <v-checkbox
                color="primary"
                density="compact"
                label="I confirm this program meets the policies outlined in the StudentAid BC policy manual."
                v-model="formModel.programDeclaration"
                hide-details="auto"
                :rules="[requiredDeclarationRule]"
                :readonly="isProgramDetailReadonly"
              />
            </content-group>
          </body-header-container>
          <json-forms
            :data="dynamicFormData"
            :schema="programDynamicSchema"
            :uischema="programDynamicUiSchema"
            :renderers="programDynamicFormRenderers"
            :ajv="programDynamicFormAjv"
            :readonly="isProgramDetailReadonly"
            @change="onDynamicFormChange"
          />
        </v-form>
      </v-skeleton-loader>
    </content-group>
    <footer-buttons
      primary-label="Submit"
      @secondary-click="$emit('cancel')"
      @primary-click="submit"
      :disable-primary-button="isProcessing"
      :processing="isProcessing"
      v-if="!isReadonly && !loading"
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
  CIP_CODE_REGEX,
  NOC_REGEX,
  SABC_PROGRAM_CODE_REGEX,
  PROGRAM_ENTRANCE_REQUIREMENT_NONE,
  REGULATORY_BODY_OTHER,
  AVIATION_PRIVATE_PILOT_TRAINING,
} from "@/constants/program-constants";
import { computed, ref, watch, watchEffect } from "vue";
import type { ComponentItemType, VForm, ProgramFormModel } from "@/types";
import {
  FormYesNoOptions,
  ProgramIntensity,
  ProgramCourseLoadCalculationTypes,
  ProgramDeliveryTypeValues,
  ProgramESLPercentage,
  ProgramCalculatedDataKey,
  SystemLookupCategory,
} from "@/types";
import { EducationProgramService } from "@/services/EducationProgramService";
import RadioOptionsGroup from "@/components/generic/RadioOptionsGroup.vue";
import RadioOptionsYesNo from "@/components/generic/RadioOptionsYesNo.vue";
import CheckboxOptionsGroup from "@/components/generic/CheckboxOptionsGroup.vue";
import ProgramEligibilityBanner from "@/components/institutions/banners/ProgramEligibilityBanner.vue";
import {
  EducationProgramAPIInDTO,
  EducationProgramAPIOutDTO,
  SystemLookupEntryAPIOutDTO,
} from "@/services/http/dto";
import { SystemLookupConfigurationService } from "@/services/SystemLookupConfigurationService";
import { JsonForms } from "@jsonforms/vue";
import type { JsonFormsChangeEvent } from "@jsonforms/vue";
import { programDynamicFormRenderers } from "@/renderers/jsonforms";
import { programDynamicFormAjv } from "@/renderers/jsonforms/ajv";
import {
  programDynamicSchema,
  programDynamicUiSchema,
} from "./ProgramFormDynamicSchema.poc";

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

const PROGRAM_ESL_ITEMS: ComponentItemType[] = [
  { title: "Less than 20%", value: ProgramESLPercentage.LessThan20 },
  { title: "20% or more", value: ProgramESLPercentage.GreaterThanEqual20 },
];

interface ProgramFormProps {
  programId?: number;
  isBCPublic?: boolean;
  isBCPrivate?: boolean;
  readOnly?: boolean;
  isProcessing?: boolean;
}

interface ProgramFormContext {
  hasOfferings: boolean;
  isActive: boolean;
  isBCPublic: boolean;
  isBCPrivate: boolean;
  isBCInstitution: boolean;
}

const tooltipMaxWidth = 670;
const loading = ref(false);
let isLookupLoaded = false;
const snackBar = useSnackBar();
const props = withDefaults(defineProps<ProgramFormProps>(), {
  programId: undefined,
  isBCPublic: undefined,
  isBCPrivate: undefined,
  readOnly: true,
  isProcessing: false,
});
const emit = defineEmits<{
  cancel: [];
  submitted: [program: EducationProgramAPIInDTO];
  loaded: [program: EducationProgramAPIOutDTO];
}>();
const formModel = ref<ProgramFormModel>({} as ProgramFormModel);
const formContext = ref<ProgramFormContext>();
// POC: dynamic program form data/errors, kept isolated from formModel.
// In a full implementation this would be loaded from/saved to the
// program's JSONB column alongside the schema version used to produce it.
const dynamicFormData = ref<Record<string, unknown>>({});
const dynamicFormErrors = ref<JsonFormsChangeEvent["errors"]>([]);
const onDynamicFormChange = (event: JsonFormsChangeEvent) => {
  dynamicFormData.value = event.data;
  dynamicFormErrors.value = event.errors;
};
const isReadonly = computed(
  () => props.readOnly || (!!props.programId && !formContext.value?.isActive),
);
const isProgramDetailReadonly = computed(
  () => isReadonly.value || formContext.value?.hasOfferings,
);
const {
  checkLengthRule,
  checkRegexPattern,
  checkNullOrEmptyRule,
  requiredDeclarationRule,
} = useRules();
const { convertCheckboxObjectModelToArray } = useProgram();
const programForm = ref({} as VForm);
const programCredentialLookupItems = ref<SystemLookupEntryAPIOutDTO[]>([]);
const programLengthLookupItems = ref<SystemLookupEntryAPIOutDTO[]>([]);
const programEntranceRequirementLookupItems = ref<SystemLookupEntryAPIOutDTO[]>(
  [],
);
const institutionRegulatoryBodyLookupItems = ref<SystemLookupEntryAPIOutDTO[]>(
  [],
);
const programAviationCredentialLookupItems = ref<SystemLookupEntryAPIOutDTO[]>(
  [],
);
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
      !formContext.value?.isBCInstitution &&
      formModel.value.deliveredOnlineAlsoOnsite === FormYesNoOptions.No,
    earnAcademicCreditsOtherInstitution:
      !formContext.value?.isBCInstitution &&
      formModel.value.deliveredOnlineAlsoOnsite === FormYesNoOptions.No &&
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
      formModel.value.hasWILComponent === FormYesNoOptions.Yes &&
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
    formModel.value.programDeliveryTypes?.includes(
      ProgramDeliveryTypeValues.Online,
    ) &&
    !formModel.value.programDeliveryTypes?.includes(
      ProgramDeliveryTypeValues.Onsite,
    ),
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
    formModel.value.entranceRequirements?.includes(
      PROGRAM_ENTRANCE_REQUIREMENT_NONE,
    ),
  showExceedingESLBanner:
    formModel.value.eslEligibility === ProgramESLPercentage.GreaterThanEqual20,
  showJointDesignatedInstitutionBanner:
    formModel.value.hasJointDesignatedInstitution === FormYesNoOptions.Yes,
  showJointNonDesignatedInstitutionBanner:
    formModel.value.hasJointDesignatedInstitution === FormYesNoOptions.No,
  showWILNotApprovalBanner:
    formModel.value.hasWILComponent === FormYesNoOptions.Yes &&
    formModel.value.isWILApproved === FormYesNoOptions.No,
  showWILEligibilityBanner:
    formModel.value.hasWILComponent === FormYesNoOptions.Yes &&
    formModel.value.isWILApproved === FormYesNoOptions.Yes &&
    formModel.value.wilProgramEligibility === FormYesNoOptions.No,
  showTravelEligibilityBanner:
    formModel.value.hasTravel === FormYesNoOptions.Yes &&
    formModel.value.travelProgramEligibility === FormYesNoOptions.No,
  showIntlExchangeEligibilityBanner:
    formModel.value.hasIntlExchange === FormYesNoOptions.Yes &&
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
    const [errorSummary] = document.getElementsByClassName("error-summary");
    if (errorSummary) {
      errorSummary.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    return;
  }
  const submitData: EducationProgramAPIInDTO = {
    ...formModel.value,
    isBCPrivate: formContext.value!.isBCPrivate,
    isBCPublic: formContext.value!.isBCPublic,
  };
  emit("submitted", submitData);
};
const updateEntranceRequirements = () => {
  const currentEntranceRequirements = formModel.value.entranceRequirements;
  if (!currentEntranceRequirements.length) {
    previousEntranceRequirements = [];
    return;
  }
  const isNonePreviouslySelected =
    previousEntranceRequirements[0] === PROGRAM_ENTRANCE_REQUIREMENT_NONE;
  if (isNonePreviouslySelected) {
    formModel.value.entranceRequirements = currentEntranceRequirements.filter(
      (requirement) => requirement !== PROGRAM_ENTRANCE_REQUIREMENT_NONE,
    );
  } else {
    formModel.value.entranceRequirements = currentEntranceRequirements.includes(
      PROGRAM_ENTRANCE_REQUIREMENT_NONE,
    )
      ? [PROGRAM_ENTRANCE_REQUIREMENT_NONE]
      : currentEntranceRequirements;
  }
  previousEntranceRequirements = formModel.value.entranceRequirements;
};

const loadLookups = async (): Promise<void> => {
  try {
    loading.value = true;
    const [
      programCredentialType,
      programLength,
      programEntranceRequirement,
      institutionRegulatoryBody,
      programAviationCredential,
    ] = await Promise.all([
      SystemLookupConfigurationService.shared.getSystemLookupEntriesByCategory(
        SystemLookupCategory.ProgramCredentialType,
      ),
      SystemLookupConfigurationService.shared.getSystemLookupEntriesByCategory(
        SystemLookupCategory.ProgramLength,
      ),
      SystemLookupConfigurationService.shared.getSystemLookupEntriesByCategory(
        SystemLookupCategory.ProgramEntranceRequirement,
      ),
      SystemLookupConfigurationService.shared.getSystemLookupEntriesByCategory(
        SystemLookupCategory.InstitutionRegulatoryBody,
      ),
      SystemLookupConfigurationService.shared.getSystemLookupEntriesByCategory(
        SystemLookupCategory.ProgramAviationCredential,
      ),
    ]);
    programCredentialLookupItems.value = programCredentialType.items;
    programLengthLookupItems.value = programLength.items;
    programEntranceRequirementLookupItems.value =
      programEntranceRequirement.items;
    institutionRegulatoryBodyLookupItems.value =
      institutionRegulatoryBody.items;
    programAviationCredentialLookupItems.value =
      programAviationCredential.items;
    isLookupLoaded = true;
  } catch {
    snackBar.error("Unexpected error while loading data.");
  } finally {
    loading.value = false;
  }
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
const calculateFieldOfStudyCode = async () => {
  if (
    isReadonly.value ||
    !formModel.value.credentialType ||
    !formModel.value.cipCode ||
    !CIP_CODE_REGEX.test(formModel.value.cipCode)
  ) {
    return;
  }
  const evaluationResult = await EducationProgramService.shared.evaluate({
    data: formModel.value,
    calculatedDataKeys: [ProgramCalculatedDataKey.FieldOfStudyCode],
  });
  formModel.value.fieldOfStudyCode =
    evaluationResult.calculatedData[ProgramCalculatedDataKey.FieldOfStudyCode]!;
};
watchEffect(async () => {
  if (!isLookupLoaded) {
    await loadLookups();
  }
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
