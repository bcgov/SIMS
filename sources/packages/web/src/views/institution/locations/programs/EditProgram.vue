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
            <v-text-field
              v-model="editProgramFormModel.name"
              density="compact"
              label="Program name"
              variant="outlined"
              :rules="[
                (v) =>
                  checkLengthRule(v, PROGRAM_NAME_MAX_LENGTH, 'Program name'),
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
            />
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
            />
            <option-items-radio
              v-if="componentDisplayConditions.showDeliveredOnlineAlsoOnsite"
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
              v-model="editProgramFormModel.earnAcademicCreditsOtherInstitution"
              color="primary"
              label="Will they earn academic credits that are recognized at another designated institution listed in the BC Transfer Guide or other acceptable articulation agreements from other jurisdictions?"
              :items="YES_NO_VALUE_ITEMS"
            ></option-items-radio>
            <option-items-radio
              v-model="editProgramFormModel.courseLoadCalculation"
              color="primary"
              label="Program course load calculation is:"
              :items="PROGRAM_COURSE_LOAD_ITEMS"
              :rules="[
                (v: string) =>
                  checkNullOrEmptyRule(v, 'Program course load calculation:'),
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
            <option-items-radio
              v-model="editProgramFormModel.hasWILComponent"
              color="primary"
              label="Does this program have a WIL component?"
              :items="YES_NO_VALUE_ITEMS"
            ></option-items-radio>
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

// const PROGRAM_ESL_ITEMS: ComponentItemType[] = [
//   { title: "Less than 20%", value: ProgramESLPercentage.LessThan20 },
//   { title: "20% or more", value: ProgramESLPercentage.GreaterThanEqual20 },
// ];
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
const { checkLengthRule, checkRegexPattern, checkNullOrEmptyRule } = useRules();
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
