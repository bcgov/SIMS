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
import {
  PROGRAM_ENTRANCE_REQUIREMENT_NONE,
  REGULATORY_BODY_OTHER,
  AVIATION_PRIVATE_PILOT_TRAINING,
} from "@/constants/program-constants";
import { computed, ref, watchEffect } from "vue";
import type { ProgramFormModel } from "@/types";
import {
  FormYesNoOptions,
  ProgramCourseLoadCalculationTypes,
  ProgramDeliveryTypeValues,
  ProgramESLPercentage,
} from "@/types";
import { EducationProgramService } from "@/services/EducationProgramService";
import {
  EducationProgramAPIInDTO,
  EducationProgramAPIOutDTO,
} from "@/services/http/dto";
import { JsonForms } from "@jsonforms/vue";
import type { JsonFormsChangeEvent } from "@jsonforms/vue";
import { RuleEffect } from "@jsonforms/core";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { programFormRenderers } from "@/renderers/jsonforms";
import { programFormAjv } from "@/renderers/jsonforms/ajv";

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

const loading = ref(false);
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
  formModel.value = data as unknown as ProgramFormModel;
};

// Fully static and self-contained: every value below is a literal (no
// imported constant/regex/enum references), so this object is pure JSON
// data that can be JSON.stringify()'d directly into a JSONB column and
// handed to a server-side AJV instance unchanged - matching the "schema
// resolved and owned server-side" direction from earlier. The 5 fields
// marked PLACEHOLDER use made-up enum values standing in for what a real
// lookup-resolving endpoint would provide; per "credentialType will use a
// regular enum of values", these are plain "enum" arrays (raw values, no
// separate title) rather than the labelled "oneOf" shape used for the
// fixed, non-lookup fields below. Conditional requirements that depend on
// more than one field use "allOf" of {if,then} pairs, since a single
// if/then/else can only express one condition.
const programFormSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      maxLength: 300,
      title: "Program name",
    },
    description: {
      type: "string",
      maxLength: 500,
      title: "Program description",
    },
    credentialType: {
      oneOf: [
        {
          const: "undergraduateCertificate",
          title: "Undergraduate Certificate",
        },
        { const: "undergraduateCitation", title: "Undergraduate Citation" },
        { const: "undergraduateDiploma", title: "Undergraduate Diploma" },
        { const: "undergraduateDegree", title: "Undergraduate Degree" },
        { const: "graduateCertificate", title: "Graduate Certificate" },
        { const: "graduateDiploma", title: "Graduate Diploma" },
        {
          const: "graduateDegreeOrMasters",
          title: "Graduate Degree / Master's",
        },
        {
          const: "postGraduateOrDoctorate",
          title: "Post-Graduate / Doctorate",
        },
        { const: "qualifyingStudies", title: "Qualifying Studies" },
      ],
      title: "Credential type",
    },
    cipCode: {
      type: "string",
      pattern: "^\\d{2}\\.\\d{4}$",
      title: "Classification of Instructional Programs (CIP)",
      errorMessage: {
        pattern:
          "Classification of Instructional Programs (CIP) format is invalid.",
      },
    },
    fieldOfStudyCode: {
      type: "number",
      title: "Field of study code",
    },
    nocCode: {
      type: "string",
      pattern: "^$|^\\d{5}$",
      title: "National Occupational Classification (NOC)",
      errorMessage: {
        pattern:
          "National Occupational Classification (NOC) format is invalid.",
      },
    },
    sabcCode: {
      type: "string",
      pattern: "^$|^[A-Z]{3}\\d$",
      title: "SABC program code",
      errorMessage: { pattern: "SABC program code format is invalid." },
    },
    institutionProgramCode: {
      type: "string",
      maxLength: 50,
      title: "Institution Program Code",
    },
    programIntensity: {
      oneOf: [
        { const: "Full Time and Part Time", title: "Yes" },
        { const: "Full Time", title: "No" },
      ],
      title: "Are students able to take this on a part time basis?",
    },
    programDeliveryTypes: {
      type: "array",
      items: {
        oneOf: [
          { const: "deliveredOnSite", title: "On site" },
          { const: "deliveredOnline", title: "Online" },
        ],
      },
      minItems: 1,
      title: "How will this program be delivered? (Select all that apply)",
      errorMessage: {
        minItems: "At least one program delivery type must be selected.",
      },
    },
    isBCInstitution: { type: "boolean" },
    isBCPrivate: { type: "boolean" },
    deliveredOnlineAlsoOnsite: {
      type: "string",
      format: "yesNo",
      enum: ["yes", "no"],
      title:
        "Will the program also be offered and delivered at 100% course load on site?",
    },
    sameOnlineCreditsEarned: {
      type: "string",
      format: "yesNo",
      enum: ["yes", "no"],
      title:
        "Will the students earn the same number of credits in the same time period as students in other StudentAid BC eligible programs delivered on site?",
    },
    earnAcademicCreditsOtherInstitution: {
      type: "string",
      format: "yesNo",
      enum: ["yes", "no"],
      title:
        "Will they earn academic credits that are recognized at another designated institution listed in the BC Transfer Guide or other acceptable articulation agreements from other jurisdictions?",
    },
    completionYears: {
      oneOf: [
        { const: "12WeeksTo52Weeks", title: "12 weeks to 52 weeks" },
        { const: "53WeeksTo59Weeks", title: "53 weeks to 59 weeks" },
        {
          const: "60WeeksToLessThan2Years",
          title: "60 weeks to less than 2 years",
        },
        {
          const: "2YearsToLessThan3Years",
          title: "2 Years to less than 3Years",
        },
        {
          const: "3YearsToLessThan4Years",
          title: "3 Years to less than 4 Years",
        },
        {
          const: "4YearsToLessThan5Years",
          title: "4 Years to less than 5Years",
        },
        { const: "5YearsOrMore", title: "5 Years or More" },
      ],
      title: "Program length",
    },
    courseLoadCalculation: {
      oneOf: [
        { const: "credit", title: "Credit based" },
        { const: "hours", title: "Hours based" },
      ],
      title: "Program course load calculation is:",
    },
    minHoursWeek: {
      type: "string",
      format: "yesNo",
      enum: ["yes", "no"],
      title:
        "Does this program include a minimum of 20 instructional hours per week?",
    },
    regulatoryBody: {
      oneOf: [
        { const: "ptiru", title: "PTIRU" },
        { const: "dqab", title: "DQAB" },
        {
          const: "privateActLegislature",
          title: "Private Act of B.C. Legislature",
        },
        { const: "skilledTradesBC", title: "Skilled Trades BC" },
        { const: "icbc", title: "ICBC" },
        {
          const: "senateOrEducationCouncil",
          title:
            "Senate, Academic Council, Education Council, and/or Program Council and Board of Governors",
        },
        { const: "other", title: "Other" },
      ],
      title: "Which regulatory body does this program belong to?",
    },
    otherRegulatoryBody: {
      type: "string",
      maxLength: 100,
      title: "Other institution regulatory body",
    },
    entranceRequirements: {
      type: "array",
      items: {
        oneOf: [
          {
            const: "minHighSchool",
            title: "Students to have graduated from grade 12 or equivalent.",
          },
          {
            const: "hasMinimumAge",
            title:
              "Students are 19 years old or older before the start of classes.",
          },
          {
            const: "requirementsByInstitution",
            title:
              "For post-secondary level academic credit-based programs: This program has entrance requirements established by the institution that enable completion of the program of study.",
          },
          {
            const: "requirementsByBCITA",
            title:
              "This program is approved by the SkilledTradesBC and students must meet the entrance requirements set by the B.C. ITA.",
          },
          {
            const: "noneOfTheAboveEntranceRequirements",
            title: "None of the above",
          },
        ],
      },
      minItems: 1,
      title:
        "What are the entrance requirements for this program? (Select all that apply)",
      errorMessage: {
        minItems: "At least one entrance requirement must be selected.",
      },
      if: {
        contains: { const: "noneOfTheAboveEntranceRequirements" },
      },
      then: {
        maxItems: 1,
        errorMessage: {
          maxItems:
            '"None of the above" cannot be combined with other entrance requirements.',
        },
      },
    },
    eslEligibility: {
      oneOf: [
        { const: "lessThan20", title: "Less than 20%" },
        { const: "20OrMore", title: "20% or more" },
      ],
      title: "What percentage of the program has ESL Content?",
    },
    hasJointInstitution: {
      type: "string",
      format: "yesNo",
      enum: ["yes", "no"],
      title:
        "Is the program offered jointly or in partnership with other institutions?",
    },
    hasJointDesignatedInstitution: {
      type: "string",
      format: "yesNo",
      enum: ["yes", "no"],
      title:
        "Are all institutions you partner with for this program designated by StudentAid BC?",
    },
    hasWILComponent: {
      type: "string",
      format: "yesNo",
      enum: ["yes", "no"],
      title: "Does this program have a WIL component?",
    },
    isWILApproved: {
      type: "string",
      format: "yesNo",
      enum: ["yes", "no"],
      title: "Is the WIL approved by your regulator or oversight body?",
    },
    wilProgramEligibility: {
      type: "string",
      format: "yesNo",
      enum: ["yes", "no"],
      title:
        "Does the WIL meet the program eligibility requirements according to StudentAid BC policy?",
    },
    hasTravel: {
      type: "string",
      format: "yesNo",
      enum: ["yes", "no"],
      title: "Is a field trip, field placement or travel part of this program?",
    },
    travelProgramEligibility: {
      type: "string",
      format: "yesNo",
      enum: ["yes", "no"],
      title:
        "Does the field trip, field placement, or travel meet the program eligibility requirements according to StudentAid BC policy?",
    },
    hasIntlExchange: {
      type: "string",
      format: "yesNo",
      enum: ["yes", "no"],
      title: "Does the program have an international exchange?",
    },
    intlExchangeProgramEligibility: {
      type: "string",
      format: "yesNo",
      enum: ["yes", "no"],
      title:
        "Does the international exchange meet the program eligibility requirements according to StudentAid BC policy?",
    },
    isAviationProgram: {
      type: "string",
      format: "yesNo",
      enum: ["yes", "no"],
      title: "Does this program contain aviation?",
    },
    credentialTypesAviation: {
      type: "array",
      oneOf: [
        {
          const: "commercialPilotTraining",
          title: "Commercial Pilot Training",
        },
        { const: "instructorsRating", title: "Instructor's Rating" },
        { const: "endorsements", title: "Endorsements" },
        { const: "privatePilotTraining", title: "Private Pilot Training" },
        ,
      ],
      minItems: 1,
      title: "Which credential type(s) are included? (Select all that apply)",
      errorMessage: {
        minItems: "At least one credential type must be selected.",
      },
    },
    minHoursWeekAvi: {
      type: "string",
      format: "yesNo",
      enum: ["yes", "no"],
      title:
        "Does this program include a minimum of 15 instructional hours per week?",
    },
    programDeclaration: {
      type: "boolean",
      const: true,
      errorMessage: { const: "You must confirm to proceed." },
    },
  },
  required: [
    "name",
    "credentialType",
    "cipCode",
    "programIntensity",
    "programDeliveryTypes",
    "completionYears",
    "courseLoadCalculation",
    "regulatoryBody",
    "entranceRequirements",
    "eslEligibility",
    "hasJointInstitution",
    "hasWILComponent",
    "hasTravel",
    "hasIntlExchange",
    "isAviationProgram",
  ],
  errorMessage: {
    required: {
      name: "Program name is required.",
      credentialType: "Credential type is required.",
      cipCode: "Classification of Instructional Programs (CIP) is required.",
      programIntensity:
        "Please indicate if students are able to take this on a part time basis.",
      programDeliveryTypes: "Please select how this program will be delivered.",
      completionYears: "Please select the program length.",
      courseLoadCalculation:
        "Please select the program course load calculation.",
      regulatoryBody:
        "Please select which regulatory body this program belongs to.",
      entranceRequirements: "Please select at least one entrance requirement.",
      eslEligibility:
        "Please select the ESL content percentage for this program.",
      hasJointInstitution:
        "Please indicate if the program is offered jointly or in partnership with other institutions.",
      hasWILComponent: "Please indicate if this program has a WIL component.",
      hasTravel:
        "Please indicate if a field trip, field placement or travel is part of this program.",
      hasIntlExchange:
        "Please indicate if the program has an international exchange.",
      isAviationProgram: "Please indicate if this program contains aviation.",
    },
  },
  allOf: [
    {
      if: {
        required: ["isBCInstitution", "programDeliveryTypes"],
        properties: {
          isBCInstitution: { const: false },
          programDeliveryTypes: {
            contains: { const: "deliveredOnline" },
          },
        },
      },
      then: {
        required: ["deliveredOnlineAlsoOnsite"],
        errorMessage: {
          required:
            "Please indicate if the program will also be offered and delivered at 100% course load on site.",
        },
      },
    },
    {
      if: {
        required: ["isBCInstitution", "deliveredOnlineAlsoOnsite"],
        properties: {
          isBCInstitution: { const: false },
          deliveredOnlineAlsoOnsite: { const: "no" },
        },
      },
      then: {
        required: ["sameOnlineCreditsEarned"],
        errorMessage: {
          required:
            "Please indicate if students will earn the same number of credits in the same time period.",
        },
      },
    },
    {
      if: {
        required: [
          "isBCInstitution",
          "deliveredOnlineAlsoOnsite",
          "sameOnlineCreditsEarned",
        ],
        properties: {
          isBCInstitution: { const: false },
          deliveredOnlineAlsoOnsite: { const: "no" },
          sameOnlineCreditsEarned: { const: "no" },
        },
      },
      then: {
        required: ["earnAcademicCreditsOtherInstitution"],
        errorMessage: {
          required:
            "Please indicate if students will earn academic credits recognized at another designated institution.",
        },
      },
    },
    {
      if: {
        required: ["courseLoadCalculation"],
        properties: {
          courseLoadCalculation: {
            const: "hours",
          },
        },
      },
      then: {
        required: ["minHoursWeek"],
        errorMessage: {
          required:
            "Please indicate if this program includes a minimum of 20 instructional hours per week.",
        },
      },
    },
    {
      if: {
        required: ["regulatoryBody"],
        properties: { regulatoryBody: { const: "other" } },
      },
      then: {
        required: ["otherRegulatoryBody"],
        errorMessage: {
          required: "Please specify the other institution regulatory body.",
        },
      },
    },
    {
      if: {
        required: ["hasJointInstitution"],
        properties: { hasJointInstitution: { const: "yes" } },
      },
      then: {
        required: ["hasJointDesignatedInstitution"],
        errorMessage: {
          required:
            "Please indicate if all partner institutions are designated by StudentAid BC.",
        },
      },
    },
    {
      if: {
        required: ["hasWILComponent"],
        properties: { hasWILComponent: { const: "yes" } },
      },
      then: {
        required: ["isWILApproved"],
        errorMessage: {
          required:
            "Please indicate if the WIL is approved by your regulator or oversight body.",
        },
      },
    },
    {
      if: {
        required: ["hasWILComponent", "isWILApproved"],
        properties: {
          hasWILComponent: { const: "yes" },
          isWILApproved: { const: "yes" },
        },
      },
      then: {
        required: ["wilProgramEligibility"],
        errorMessage: {
          required:
            "Please indicate if the WIL meets the program eligibility requirements.",
        },
      },
    },
    {
      if: {
        required: ["hasTravel"],
        properties: { hasTravel: { const: "yes" } },
      },
      then: {
        required: ["travelProgramEligibility"],
        errorMessage: {
          required:
            "Please indicate if the field trip, field placement, or travel meets the program eligibility requirements.",
        },
      },
    },
    {
      if: {
        required: ["hasIntlExchange"],
        properties: { hasIntlExchange: { const: "yes" } },
      },
      then: {
        required: ["intlExchangeProgramEligibility"],
        errorMessage: {
          required:
            "Please indicate if the international exchange meets the program eligibility requirements.",
        },
      },
    },
    {
      if: {
        required: ["isAviationProgram"],
        properties: { isAviationProgram: { const: "yes" } },
      },
      then: {
        required: ["credentialTypesAviation", "minHoursWeekAvi"],
        errorMessage: {
          required:
            "Please select at least one credential type and indicate if the program includes a minimum of 15 instructional hours per week.",
        },
      },
    },
  ],
} as JsonSchema;

// UI-only visibility rules (SHOW effects). Several mirror the equivalent
// "then" branch above so display and requiredness agree, and use AND
// conditions (with contains/not:{contains:} for array membership) since a
// leaf condition can only reference one scope at a time.
const programFormUiSchema = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Group",
      label: "Program details",
      elements: [
        {
          type: "VerticalLayout",
          elements: [
            { type: "Control", scope: "#/properties/name" },
            {
              type: "Control",
              scope: "#/properties/description",
              options: { multiline: true },
            },
            {
              type: "Control",
              scope: "#/properties/credentialType",
              options: { component: "select" },
            },
            {
              type: "Control",
              scope: "#/properties/cipCode",
              options: { hint: "Format (##.####)" },
            },
            { type: "Control", scope: "#/properties/fieldOfStudyCode" },
            {
              type: "Control",
              scope: "#/properties/nocCode",
              options: { hint: "Format (#####) Optional**" },
            },
            {
              type: "Control",
              scope: "#/properties/sabcCode",
              options: {
                hint: "Format (XXX#) Mandatory field if using the 'Offerings Upload' feature. Otherwise optional.",
              },
            },
            {
              type: "Control",
              scope: "#/properties/institutionProgramCode",
            },
          ],
        },
      ],
    },
    {
      type: "Group",
      label: "Program eligibility",
      elements: [
        {
          type: "VerticalLayout",
          elements: [
            {
              type: "Control",
              scope: "#/properties/programIntensity",
              options: {
                component: "radio",
                tooltip:
                  "A part-time program has a course load between 20 and 59%. A full-time program must have a course load of: 60% or greater or Between 40 and 60% for students with a permanent disability.",
              },
            },
            {
              type: "Control",
              scope: "#/properties/programDeliveryTypes",
            },
            {
              type: "Label",
              options: {
                header:
                  "This program requires review by StudentAid BC to determine eligibility.",
              },
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  type: "AND",
                  conditions: [
                    {
                      scope: "#/properties/isBCPrivate",
                      schema: { const: true },
                    },
                    {
                      scope: "#/properties/programDeliveryTypes",
                      schema: {
                        contains: { const: ProgramDeliveryTypeValues.Online },
                      },
                    },
                    {
                      scope: "#/properties/programDeliveryTypes",
                      schema: {
                        not: {
                          contains: { const: ProgramDeliveryTypeValues.Onsite },
                        },
                      },
                    },
                  ],
                },
              },
            },
            {
              type: "Control",
              scope: "#/properties/deliveredOnlineAlsoOnsite",
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  type: "AND",
                  conditions: [
                    {
                      scope: "#/properties/isBCInstitution",
                      schema: { const: false },
                    },
                    {
                      scope: "#/properties/programDeliveryTypes",
                      schema: {
                        contains: { const: ProgramDeliveryTypeValues.Online },
                      },
                    },
                  ],
                },
              },
            },
            {
              type: "Control",
              scope: "#/properties/sameOnlineCreditsEarned",
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  type: "AND",
                  conditions: [
                    {
                      scope: "#/properties/isBCInstitution",
                      schema: { const: false },
                    },
                    {
                      scope: "#/properties/deliveredOnlineAlsoOnsite",
                      schema: { const: "no" },
                    },
                  ],
                },
              },
            },
            {
              type: "Control",
              scope: "#/properties/earnAcademicCreditsOtherInstitution",
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  type: "AND",
                  conditions: [
                    {
                      scope: "#/properties/isBCInstitution",
                      schema: { const: false },
                    },
                    {
                      scope: "#/properties/deliveredOnlineAlsoOnsite",
                      schema: { const: "no" },
                    },
                    {
                      scope: "#/properties/sameOnlineCreditsEarned",
                      schema: { const: "no" },
                    },
                  ],
                },
              },
            },
            {
              type: "Label",
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  type: "AND",
                  conditions: [
                    {
                      scope: "#/properties/isBCInstitution",
                      schema: { const: false },
                    },
                    {
                      scope: "#/properties/deliveredOnlineAlsoOnsite",
                      schema: { const: "no" },
                    },
                    {
                      scope: "#/properties/sameOnlineCreditsEarned",
                      schema: { const: "no" },
                    },
                    {
                      scope: "#/properties/earnAcademicCreditsOtherInstitution",
                      schema: { const: "no" },
                    },
                  ],
                },
              },
            },
            {
              type: "Control",
              scope: "#/properties/completionYears",
              options: {
                component: "select",
                hint: "This qualifies students for specific funds or grants.",
              },
            },
            {
              type: "Control",
              scope: "#/properties/courseLoadCalculation",
              options: { component: "radio" },
            },
            {
              type: "Control",
              scope: "#/properties/minHoursWeek",
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  scope: "#/properties/courseLoadCalculation",
                  schema: { const: ProgramCourseLoadCalculationTypes.Hours },
                },
              },
            },
            {
              type: "Label",
              options: {
                summary:
                  "The program needs to be a minimum of 20 instructional hours.",
              },
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  type: "AND",
                  conditions: [
                    {
                      scope: "#/properties/courseLoadCalculation",
                      schema: {
                        const: ProgramCourseLoadCalculationTypes.Hours,
                      },
                    },
                    {
                      scope: "#/properties/minHoursWeek",
                      schema: { const: "no" },
                    },
                    {
                      scope: "#/properties/isAviationProgram",
                      schema: { const: "no" },
                    },
                  ],
                },
              },
            },
            {
              type: "Control",
              scope: "#/properties/regulatoryBody",
              options: {
                component: "select",
                hint: "All programs must be approved by your regulatory body to meet the criteria. If your program has not been approved yet, please contact your regulatory body first.",
              },
            },
            {
              type: "Control",
              scope: "#/properties/otherRegulatoryBody",
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  scope: "#/properties/regulatoryBody",
                  schema: { const: REGULATORY_BODY_OTHER },
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: "Group",
      label: "Entrance requirements",
      elements: [
        {
          type: "VerticalLayout",
          elements: [
            {
              type: "Control",
              scope: "#/properties/entranceRequirements",
            },
            {
              type: "Label",
              options: { summary: "An entrance requirement is required." },
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  scope: "#/properties/entranceRequirements",
                  schema: {
                    contains: { const: PROGRAM_ENTRANCE_REQUIREMENT_NONE },
                  },
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: "Group",
      label: "English as a Second Language (ESL) content",
      elements: [
        {
          type: "VerticalLayout",
          elements: [
            {
              type: "Control",
              scope: "#/properties/eslEligibility",
              options: { component: "radio" },
            },
            {
              type: "Label",
              options: { summary: "ESL can't exceed 20% of course content." },
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  scope: "#/properties/eslEligibility",
                  schema: { const: ProgramESLPercentage.GreaterThanEqual20 },
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: "Group",
      label: "Program partnerships",
      options: {
        subtitleHtml:
          'If this program is offered at a partner institution, that institution must also be designated by SABC. Find out which institutions are designated on <a href="https://studentaidbc.ca/" target="_blank" rel="noopener noreferrer">StudentAidBC.ca</a>.',
      },
      elements: [
        {
          type: "VerticalLayout",
          elements: [
            {
              type: "Control",
              scope: "#/properties/hasJointInstitution",
            },
            {
              type: "Control",
              scope: "#/properties/hasJointDesignatedInstitution",
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  scope: "#/properties/hasJointInstitution",
                  schema: { const: "yes" },
                },
              },
            },
            {
              type: "Label",
              options: {
                header: "Partner program review",
                contentHtml:
                  'This program requires additional review by StudentAid BC. Please email <a href="mailto:designat@gov.bc.ca">designat@gov.bc.ca</a> the name of the institution that you have partnered with, the name of this program, and any other details you want included as part of the review for this program.',
              },
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  scope: "#/properties/hasJointDesignatedInstitution",
                  schema: { const: "yes" },
                },
              },
            },
            {
              type: "Label",
              options: {
                summary:
                  "All partner institutions must be designated by StudentAid BC.",
              },
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  scope: "#/properties/hasJointDesignatedInstitution",
                  schema: { const: "no" },
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: "Group",
      label: "Work-integrated learning (WIL)",
      elements: [
        {
          type: "VerticalLayout",
          elements: [
            { type: "Control", scope: "#/properties/hasWILComponent" },
            {
              type: "Control",
              scope: "#/properties/isWILApproved",
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  scope: "#/properties/hasWILComponent",
                  schema: { const: "yes" },
                },
              },
            },
            {
              type: "Label",
              options: {
                summary:
                  "The work-integrated learning component must be approved by your regulator or oversight body first.",
              },
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  type: "AND",
                  conditions: [
                    {
                      scope: "#/properties/hasWILComponent",
                      schema: { const: "yes" },
                    },
                    {
                      scope: "#/properties/isWILApproved",
                      schema: { const: "no" },
                    },
                  ],
                },
              },
            },
            {
              type: "Control",
              scope: "#/properties/wilProgramEligibility",
              options: {
                tooltipHtml:
                  '<span>For the work-integrated learning experience to qualify for student financial assistance it must be:</span><ul class="ps-3"><li>Required for graduation (in the case of a co-op education placement it must either be required for graduation and/or result in a credential with a co-op designation);</li><li>Linked to the curriculum; and</li><li>Not exceed 50% of the program (or no more than 20% for practicums and 10% for preceptorships) unless otherwise regulated as a requirement by an oversight body (e.g., Early Childhood Educators (ECE) Registry).</li></ul>',
              },
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  type: "AND",
                  conditions: [
                    {
                      scope: "#/properties/hasWILComponent",
                      schema: { const: "yes" },
                    },
                    {
                      scope: "#/properties/isWILApproved",
                      schema: { const: "yes" },
                    },
                  ],
                },
              },
            },
            {
              type: "Label",
              options: { summary: "This must meet the StudentAid BC policy." },
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  type: "AND",
                  conditions: [
                    {
                      scope: "#/properties/hasWILComponent",
                      schema: { const: "yes" },
                    },
                    {
                      scope: "#/properties/isWILApproved",
                      schema: { const: "yes" },
                    },
                    {
                      scope: "#/properties/wilProgramEligibility",
                      schema: { const: "no" },
                    },
                  ],
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: "Group",
      label: "Field trip, field placement, or travel",
      elements: [
        {
          type: "VerticalLayout",
          elements: [
            { type: "Control", scope: "#/properties/hasTravel" },
            {
              type: "Control",
              scope: "#/properties/travelProgramEligibility",
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  scope: "#/properties/hasTravel",
                  schema: { const: "yes" },
                },
              },
            },
            {
              type: "Label",
              options: { summary: "This must meet the StudentAid BC policy." },
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  type: "AND",
                  conditions: [
                    {
                      scope: "#/properties/hasTravel",
                      schema: { const: "yes" },
                    },
                    {
                      scope: "#/properties/travelProgramEligibility",
                      schema: { const: "no" },
                    },
                  ],
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: "Group",
      label: "International exchange",
      elements: [
        {
          type: "VerticalLayout",
          elements: [
            { type: "Control", scope: "#/properties/hasIntlExchange" },
            {
              type: "Control",
              scope: "#/properties/intlExchangeProgramEligibility",
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  scope: "#/properties/hasIntlExchange",
                  schema: { const: "yes" },
                },
              },
            },
            {
              type: "Label",
              options: { summary: "This must meet the StudentAid BC policy." },
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  type: "AND",
                  conditions: [
                    {
                      scope: "#/properties/hasIntlExchange",
                      schema: { const: "yes" },
                    },
                    {
                      scope: "#/properties/intlExchangeProgramEligibility",
                      schema: { const: "no" },
                    },
                  ],
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: "Group",
      label: "Aviation",
      elements: [
        {
          type: "VerticalLayout",
          elements: [
            { type: "Control", scope: "#/properties/isAviationProgram" },
            {
              type: "Control",
              scope: "#/properties/credentialTypesAviation",
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  scope: "#/properties/isAviationProgram",
                  schema: { const: "yes" },
                },
              },
            },
            {
              type: "Label",
              options: {
                summary:
                  "StudentAid BC does not provide any assistance to students for Private Pilot Training.",
              },
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  scope: "#/properties/credentialTypesAviation",
                  schema: {
                    contains: { const: AVIATION_PRIVATE_PILOT_TRAINING },
                  },
                },
              },
            },
            {
              type: "Control",
              scope: "#/properties/minHoursWeekAvi",
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  scope: "#/properties/isAviationProgram",
                  schema: { const: "yes" },
                },
              },
            },
            {
              type: "Label",
              options: {
                summary:
                  "The aviation program needs to be a minimum of 15 instructional hours.",
              },
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  scope: "#/properties/minHoursWeekAvi",
                  schema: { const: "no" },
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: "Group",
      label: "Declaration",
      elements: [
        {
          type: "VerticalLayout",
          elements: [
            {
              type: "Label",
              options: {
                plainText:
                  "All information is subject to verification and auditing.",
              },
            },
            { type: "Control", scope: "#/properties/programDeclaration" },
          ],
        },
      ],
    },
  ],
} as UISchemaElement;

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
    // When the program ID is not provided, some of the form context values are required to initialize the form.
    formContext.value = {
      isBCPublic: props.isBCPublic,
      isBCPrivate: props.isBCPrivate,
      isBCInstitution: props.isBCPrivate || props.isBCPublic,
    } as ProgramFormContext;
  }
});
</script>
