<template>
  <body-header-container title="Program"
    ><content-group>
      <v-skeleton-loader :loading="loading" type="article, text@5">
        <json-forms
          :data="formModelWithContext"
          :schema="programFormSchema"
          :uischema="programFormUiSchema"
          :renderers="programFormRenderers"
          :ajv="programFormAjv"
          :readonly="isProgramDetailReadonly"
          @change="onProgramFormChange"
        />
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
import { useProgram, useSnackBar } from "@/composables";
import { computed, ref, watchEffect } from "vue";
import type { ProgramFormModel } from "@/types";
import {
  FormYesNoOptions,
  ProgramCourseLoadCalculationTypes,
  ProgramESLPercentage,
} from "@/types";
import { EducationProgramService } from "@/services/EducationProgramService";
import {
  EducationProgramAPIInDTO,
  EducationProgramAPIOutDTO,
} from "@/services/http/dto";
import { JsonForms } from "@jsonforms/vue";
import type { JsonFormsChangeEvent } from "@jsonforms/vue";
import { programFormRenderers } from "@/renderers/jsonforms";
import { programFormAjv } from "@/renderers/jsonforms/ajv";
import { JsonSchema, UISchemaElement } from "@jsonforms/core";

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

const loading = ref(true);
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
const isReadonly = computed(
  () => props.readOnly || (!!props.programId && !formContext.value?.isActive),
);
const isProgramDetailReadonly = computed(
  () => isReadonly.value || !!formContext.value?.hasOfferings,
);
const { convertCheckboxObjectModelToArray } = useProgram();

const programFormSchema = ref<JsonSchema>({} as JsonSchema);
const programFormUiSchema = ref<UISchemaElement>({} as UISchemaElement);

// isBCInstitution/isBCPrivate live outside formModel (they come from
// formContext, populated from the loaded program/institution, not user
// input), but a few rule conditions below need them - JSON Schema/UI Schema
// rules can only reference data within the same document, via scope. They
// are stripped back out in onProgramFormChange before writing to formModel,
// so they never reach the API payload.
const formModelWithContext = computed(() => ({
  ...formModel.value,
  isBCInstitution: !!formContext.value?.isBCInstitution,
  isBCPrivate: !!formContext.value?.isBCPrivate,
}));

const programFormErrors = ref<JsonFormsChangeEvent["errors"]>([]);
const onProgramFormChange = (event: JsonFormsChangeEvent) => {
  programFormErrors.value = event.errors;
  const data = { ...event.data } as Record<string, unknown>;
  delete data.isBCInstitution;
  delete data.isBCPrivate;
  // JsonForms re-emits "change" whenever formModelWithContext feeds back into
  // its "data" prop, even when nothing actually changed. Only replacing
  // formModel when the content actually differs stops that from becoming an
  // infinite update loop (formModel -> formModelWithContext -> data prop ->
  // change event -> formModel -> ...).
  if (JSON.stringify(data) === JSON.stringify(formModel.value)) {
    return;
  }
  formModel.value = data as unknown as ProgramFormModel;
};

// UI-only visibility rules (SHOW effects). Several mirror the equivalent
// "then" branch above so display and requiredness agree, and use AND
// conditions (with contains/not:{contains:} for array membership) since a
// leaf condition can only reference one scope at a time.
// const programFormUiSchema = {
//   type: "VerticalLayout",
//   elements: [
//     {
//       type: "Group",
//       label: "Program details",
//       elements: [
//         {
//           type: "VerticalLayout",
//           elements: [
//             { type: "Control", scope: "#/properties/name" },
//             {
//               type: "Control",
//               scope: "#/properties/description",
//               options: { multiline: true },
//             },
//             {
//               type: "Control",
//               scope: "#/properties/credentialType",
//               options: { component: "select" },
//             },
//             {
//               type: "Control",
//               scope: "#/properties/cipCode",
//               options: { hint: "Format (##.####)" },
//             },
//             { type: "Control", scope: "#/properties/fieldOfStudyCode" },
//             {
//               type: "Control",
//               scope: "#/properties/nocCode",
//               options: { hint: "Format (#####) Optional**" },
//             },
//             {
//               type: "Control",
//               scope: "#/properties/sabcCode",
//               options: {
//                 hint: "Format (XXX#) Mandatory field if using the 'Offerings Upload' feature. Otherwise optional.",
//               },
//             },
//             {
//               type: "Control",
//               scope: "#/properties/institutionProgramCode",
//             },
//           ],
//         },
//       ],
//     },
//     {
//       type: "Group",
//       label: "Program eligibility",
//       elements: [
//         {
//           type: "VerticalLayout",
//           elements: [
//             {
//               type: "Control",
//               scope: "#/properties/programIntensity",
//               options: {
//                 component: "radio",
//                 tooltip:
//                   "A part-time program has a course load between 20 and 59%. A full-time program must have a course load of: 60% or greater or Between 40 and 60% for students with a permanent disability.",
//               },
//             },
//             {
//               type: "Control",
//               scope: "#/properties/programDeliveryTypes",
//             },
//             {
//               type: "Label",
//               options: {
//                 header:
//                   "This program requires review by StudentAid BC to determine eligibility.",
//               },
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   type: "AND",
//                   conditions: [
//                     {
//                       scope: "#/properties/isBCPrivate",
//                       schema: { const: true },
//                     },
//                     {
//                       scope: "#/properties/programDeliveryTypes",
//                       schema: {
//                         contains: { const: "deliveredOnline" },
//                       },
//                     },
//                     {
//                       scope: "#/properties/programDeliveryTypes",
//                       schema: {
//                         not: {
//                           contains: { const: "deliveredOnSite" },
//                         },
//                       },
//                     },
//                   ],
//                 },
//               },
//             },
//             {
//               type: "Control",
//               scope: "#/properties/deliveredOnlineAlsoOnsite",
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   type: "AND",
//                   conditions: [
//                     {
//                       scope: "#/properties/isBCInstitution",
//                       schema: { const: false },
//                     },
//                     {
//                       scope: "#/properties/programDeliveryTypes",
//                       schema: {
//                         contains: { const: "deliveredOnline" },
//                       },
//                     },
//                   ],
//                 },
//               },
//             },
//             {
//               type: "Control",
//               scope: "#/properties/sameOnlineCreditsEarned",
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   type: "AND",
//                   conditions: [
//                     {
//                       scope: "#/properties/isBCInstitution",
//                       schema: { const: false },
//                     },
//                     {
//                       scope: "#/properties/deliveredOnlineAlsoOnsite",
//                       schema: { const: "no" },
//                     },
//                   ],
//                 },
//               },
//             },
//             {
//               type: "Control",
//               scope: "#/properties/earnAcademicCreditsOtherInstitution",
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   type: "AND",
//                   conditions: [
//                     {
//                       scope: "#/properties/isBCInstitution",
//                       schema: { const: false },
//                     },
//                     {
//                       scope: "#/properties/deliveredOnlineAlsoOnsite",
//                       schema: { const: "no" },
//                     },
//                     {
//                       scope: "#/properties/sameOnlineCreditsEarned",
//                       schema: { const: "no" },
//                     },
//                   ],
//                 },
//               },
//             },
//             {
//               type: "Label",
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   type: "AND",
//                   conditions: [
//                     {
//                       scope: "#/properties/isBCInstitution",
//                       schema: { const: false },
//                     },
//                     {
//                       scope: "#/properties/deliveredOnlineAlsoOnsite",
//                       schema: { const: "no" },
//                     },
//                     {
//                       scope: "#/properties/sameOnlineCreditsEarned",
//                       schema: { const: "no" },
//                     },
//                     {
//                       scope: "#/properties/earnAcademicCreditsOtherInstitution",
//                       schema: { const: "no" },
//                     },
//                   ],
//                 },
//               },
//             },
//             {
//               type: "Control",
//               scope: "#/properties/completionYears",
//               options: {
//                 component: "select",
//                 hint: "This qualifies students for specific funds or grants.",
//               },
//             },
//             {
//               type: "Control",
//               scope: "#/properties/courseLoadCalculation",
//               options: { component: "radio" },
//             },
//             {
//               type: "Control",
//               scope: "#/properties/minHoursWeek",
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   scope: "#/properties/courseLoadCalculation",
//                   schema: { const: "hours" },
//                 },
//               },
//             },
//             {
//               type: "Label",
//               options: {
//                 summary:
//                   "The program needs to be a minimum of 20 instructional hours.",
//               },
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   type: "AND",
//                   conditions: [
//                     {
//                       scope: "#/properties/courseLoadCalculation",
//                       schema: {
//                         const: "hours",
//                       },
//                     },
//                     {
//                       scope: "#/properties/minHoursWeek",
//                       schema: { const: "no" },
//                     },
//                     {
//                       scope: "#/properties/isAviationProgram",
//                       schema: { const: "no" },
//                     },
//                   ],
//                 },
//               },
//             },
//             {
//               type: "Control",
//               scope: "#/properties/regulatoryBody",
//               options: {
//                 component: "select",
//                 hint: "All programs must be approved by your regulatory body to meet the criteria. If your program has not been approved yet, please contact your regulatory body first.",
//               },
//             },
//             {
//               type: "Control",
//               scope: "#/properties/otherRegulatoryBody",
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   scope: "#/properties/regulatoryBody",
//                   schema: { const: "other" },
//                 },
//               },
//             },
//           ],
//         },
//       ],
//     },
//     {
//       type: "Group",
//       label: "Entrance requirements",
//       elements: [
//         {
//           type: "VerticalLayout",
//           elements: [
//             {
//               type: "Control",
//               scope: "#/properties/entranceRequirements",
//             },
//             {
//               type: "Label",
//               options: { summary: "An entrance requirement is required." },
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   scope: "#/properties/entranceRequirements",
//                   schema: {
//                     contains: { const: "noneOfTheAboveEntranceRequirements" },
//                   },
//                 },
//               },
//             },
//           ],
//         },
//       ],
//     },
//     {
//       type: "Group",
//       label: "English as a Second Language (ESL) content",
//       elements: [
//         {
//           type: "VerticalLayout",
//           elements: [
//             {
//               type: "Control",
//               scope: "#/properties/eslEligibility",
//               options: { component: "radio" },
//             },
//             {
//               type: "Label",
//               options: { summary: "ESL can't exceed 20% of course content." },
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   scope: "#/properties/eslEligibility",
//                   schema: { const: "20OrMore" },
//                 },
//               },
//             },
//           ],
//         },
//       ],
//     },
//     {
//       type: "Group",
//       label: "Program partnerships",
//       options: {
//         subtitleHtml:
//           'If this program is offered at a partner institution, that institution must also be designated by SABC. Find out which institutions are designated on <a href="https://studentaidbc.ca/" target="_blank" rel="noopener noreferrer">StudentAidBC.ca</a>.',
//       },
//       elements: [
//         {
//           type: "VerticalLayout",
//           elements: [
//             {
//               type: "Control",
//               scope: "#/properties/hasJointInstitution",
//             },
//             {
//               type: "Control",
//               scope: "#/properties/hasJointDesignatedInstitution",
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   scope: "#/properties/hasJointInstitution",
//                   schema: { const: "yes" },
//                 },
//               },
//             },
//             {
//               type: "Label",
//               options: {
//                 header: "Partner program review",
//                 contentHtml:
//                   'This program requires additional review by StudentAid BC. Please email <a href="mailto:designat@gov.bc.ca">designat@gov.bc.ca</a> the name of the institution that you have partnered with, the name of this program, and any other details you want included as part of the review for this program.',
//               },
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   scope: "#/properties/hasJointDesignatedInstitution",
//                   schema: { const: "yes" },
//                 },
//               },
//             },
//             {
//               type: "Label",
//               options: {
//                 summary:
//                   "All partner institutions must be designated by StudentAid BC.",
//               },
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   scope: "#/properties/hasJointDesignatedInstitution",
//                   schema: { const: "no" },
//                 },
//               },
//             },
//           ],
//         },
//       ],
//     },
//     {
//       type: "Group",
//       label: "Work-integrated learning (WIL)",
//       elements: [
//         {
//           type: "VerticalLayout",
//           elements: [
//             { type: "Control", scope: "#/properties/hasWILComponent" },
//             {
//               type: "Control",
//               scope: "#/properties/isWILApproved",
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   scope: "#/properties/hasWILComponent",
//                   schema: { const: "yes" },
//                 },
//               },
//             },
//             {
//               type: "Label",
//               options: {
//                 summary:
//                   "The work-integrated learning component must be approved by your regulator or oversight body first.",
//               },
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   type: "AND",
//                   conditions: [
//                     {
//                       scope: "#/properties/hasWILComponent",
//                       schema: { const: "yes" },
//                     },
//                     {
//                       scope: "#/properties/isWILApproved",
//                       schema: { const: "no" },
//                     },
//                   ],
//                 },
//               },
//             },
//             {
//               type: "Control",
//               scope: "#/properties/wilProgramEligibility",
//               options: {
//                 tooltipHtml:
//                   '<span>For the work-integrated learning experience to qualify for student financial assistance it must be:</span><ul class="ps-3"><li>Required for graduation (in the case of a co-op education placement it must either be required for graduation and/or result in a credential with a co-op designation);</li><li>Linked to the curriculum; and</li><li>Not exceed 50% of the program (or no more than 20% for practicums and 10% for preceptorships) unless otherwise regulated as a requirement by an oversight body (e.g., Early Childhood Educators (ECE) Registry).</li></ul>',
//               },
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   type: "AND",
//                   conditions: [
//                     {
//                       scope: "#/properties/hasWILComponent",
//                       schema: { const: "yes" },
//                     },
//                     {
//                       scope: "#/properties/isWILApproved",
//                       schema: { const: "yes" },
//                     },
//                   ],
//                 },
//               },
//             },
//             {
//               type: "Label",
//               options: { summary: "This must meet the StudentAid BC policy." },
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   type: "AND",
//                   conditions: [
//                     {
//                       scope: "#/properties/hasWILComponent",
//                       schema: { const: "yes" },
//                     },
//                     {
//                       scope: "#/properties/isWILApproved",
//                       schema: { const: "yes" },
//                     },
//                     {
//                       scope: "#/properties/wilProgramEligibility",
//                       schema: { const: "no" },
//                     },
//                   ],
//                 },
//               },
//             },
//           ],
//         },
//       ],
//     },
//     {
//       type: "Group",
//       label: "Field trip, field placement, or travel",
//       elements: [
//         {
//           type: "VerticalLayout",
//           elements: [
//             { type: "Control", scope: "#/properties/hasTravel" },
//             {
//               type: "Control",
//               scope: "#/properties/travelProgramEligibility",
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   scope: "#/properties/hasTravel",
//                   schema: { const: "yes" },
//                 },
//               },
//             },
//             {
//               type: "Label",
//               options: { summary: "This must meet the StudentAid BC policy." },
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   type: "AND",
//                   conditions: [
//                     {
//                       scope: "#/properties/hasTravel",
//                       schema: { const: "yes" },
//                     },
//                     {
//                       scope: "#/properties/travelProgramEligibility",
//                       schema: { const: "no" },
//                     },
//                   ],
//                 },
//               },
//             },
//           ],
//         },
//       ],
//     },
//     {
//       type: "Group",
//       label: "International exchange",
//       elements: [
//         {
//           type: "VerticalLayout",
//           elements: [
//             { type: "Control", scope: "#/properties/hasIntlExchange" },
//             {
//               type: "Control",
//               scope: "#/properties/intlExchangeProgramEligibility",
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   scope: "#/properties/hasIntlExchange",
//                   schema: { const: "yes" },
//                 },
//               },
//             },
//             {
//               type: "Label",
//               options: { summary: "This must meet the StudentAid BC policy." },
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   type: "AND",
//                   conditions: [
//                     {
//                       scope: "#/properties/hasIntlExchange",
//                       schema: { const: "yes" },
//                     },
//                     {
//                       scope: "#/properties/intlExchangeProgramEligibility",
//                       schema: { const: "no" },
//                     },
//                   ],
//                 },
//               },
//             },
//           ],
//         },
//       ],
//     },
//     {
//       type: "Group",
//       label: "Aviation",
//       elements: [
//         {
//           type: "VerticalLayout",
//           elements: [
//             { type: "Control", scope: "#/properties/isAviationProgram" },
//             {
//               type: "Control",
//               scope: "#/properties/credentialTypesAviation",
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   scope: "#/properties/isAviationProgram",
//                   schema: { const: "yes" },
//                 },
//               },
//             },
//             {
//               type: "Label",
//               options: {
//                 summary:
//                   "StudentAid BC does not provide any assistance to students for Private Pilot Training.",
//               },
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   scope: "#/properties/credentialTypesAviation",
//                   schema: {
//                     contains: { const: "privatePilotTraining" },
//                   },
//                 },
//               },
//             },
//             {
//               type: "Control",
//               scope: "#/properties/minHoursWeekAvi",
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   scope: "#/properties/isAviationProgram",
//                   schema: { const: "yes" },
//                 },
//               },
//             },
//             {
//               type: "Label",
//               options: {
//                 summary:
//                   "The aviation program needs to be a minimum of 15 instructional hours.",
//               },
//               rule: {
//                 effect: "SHOW",
//                 condition: {
//                   scope: "#/properties/minHoursWeekAvi",
//                   schema: { const: "no" },
//                 },
//               },
//             },
//           ],
//         },
//       ],
//     },
//     {
//       type: "Group",
//       label: "Declaration",
//       elements: [
//         {
//           type: "VerticalLayout",
//           elements: [
//             {
//               type: "Label",
//               options: {
//                 plainText:
//                   "All information is subject to verification and auditing.",
//               },
//             },
//             { type: "Control", scope: "#/properties/programDeclaration" },
//           ],
//         },
//       ],
//     },
//   ],
// } as UISchemaElement;

const submit = async () => {
  if ((programFormErrors.value?.length ?? 0) > 0) {
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
    loading.value = true;
    const programConfiguration =
      await EducationProgramService.shared.getEducationProgramConfiguration(
        100,
      );
    programFormSchema.value =
      programConfiguration.validationSchema as JsonSchema;
    programFormUiSchema.value =
      programConfiguration.visualSchema as UISchemaElement;
    loading.value = false;
    // When the program ID is not provided, some of the form context values are required to initialize the form.
    formContext.value = {
      isBCPublic: props.isBCPublic,
      isBCPrivate: props.isBCPrivate,
      isBCInstitution: props.isBCPrivate || props.isBCPublic,
    } as ProgramFormContext;
  }
});
</script>
