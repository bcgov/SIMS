<template>
  <full-page-container>
    <template #header>
      <header-navigator
        :title="backTarget.name"
        :route-location="backTarget.to"
        sub-title="Edit Program"
      />
    </template>
    <body-header-container title="Program information"
      ><content-group>
        <error-summary :errors="editProgramForm.errors" />
        {{ editProgramFormModel.deliveredOnlineAlsoOnsite }}
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
            <option-items-radio
              v-model="editProgramFormModel.programIntensity"
              color="primary"
              label="Are students able to take this on a part time basis?"
              :items="PROGRAM_INTENSITY_RADIO_ITEMS"
            ></option-items-radio>
            <option-items-radio
              v-model="editProgramFormModel.hasWILComponent"
              color="primary"
              label="Does this program have a WIL component?"
              :items="YES_NO_VALUES_RADIO_ITEMS"
            ></option-items-radio>
            <option-items-checkbox
              v-model="editProgramFormModel.programDeliveryTypes"
              color="primary"
              label="How will this program be delivered? (Select all that apply)"
              :items="PROGRAM_DELIVERY_CHECKBOX_ITEMS"
              :rules="[
                (v) =>
                  v.length > 0 ||
                  'At least one program delivery type must be selected.',
              ]"
            ></option-items-checkbox>
            <option-items-radio
              v-model="editProgramFormModel.deliveredOnlineAlsoOnsite"
              color="primary"
              label="Will the program also be offered and delivered at 100% course load on site?"
              :items="YES_NO_VALUES_RADIO_ITEMS"
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
} from "@/constants/program-constants";
import { ref, watchEffect } from "vue";
import type {
  BackTarget,
  CheckboxItemType,
  RadioItemType,
  VForm,
} from "@/types";
import {
  FormYesNoOptions,
  ProgramIntensity,
  ProgramDeliveryTypeValues,
} from "@/types";
import { EducationProgramService } from "@/services/EducationProgramService";
import { useRouter } from "vue-router";
import { EducationProgramAPIOutDTO } from "@/services/http/dto";
import OptionItemsRadio from "@/components/generic/OptionItemsRadio.vue";
import OptionItemsCheckbox from "@/components/generic/OptionItemsCheckbox.vue";
import { YES_NO_VALUES_RADIO_ITEMS } from "@/constants";

interface EditProgramProps {
  locationId: number;
  programId: number;
  backTarget: BackTarget;
}

interface EditProgramModel {
  name: string;
  description: string;
  cipCode: string;
  nocCode: string;
  sabcCode: string;
  programIntensity: ProgramIntensity;
  hasWILComponent: FormYesNoOptions;
  programDeliveryTypes: ProgramDeliveryTypeValues[];
  deliveredOnlineAlsoOnsite: FormYesNoOptions;
}

const PROGRAM_INTENSITY_RADIO_ITEMS: RadioItemType[] = [
  { title: "Yes", value: ProgramIntensity.fullTimePartTime },
  { title: "No", value: ProgramIntensity.fullTime },
];

const PROGRAM_DELIVERY_CHECKBOX_ITEMS: CheckboxItemType[] = [
  { title: "On site", value: ProgramDeliveryTypeValues.Onsite },
  { title: "Online", value: ProgramDeliveryTypeValues.Online },
];
const loading = ref(false);
const snackBar = useSnackBar();
const props = defineProps<EditProgramProps>();
const router = useRouter();
const editProgramFormModel = ref<EditProgramModel>({} as EditProgramModel);
const program = ref<EducationProgramAPIOutDTO>();
// const canEditOnlyBasicInfo = computed(
//   () => !!program.value && !program.value.hasOfferings,
// );
// const isReadonly = computed(
//   () => !program.value || !program.value.isActive || program.value.isExpired,
// );
const { checkLengthRule, checkRegexPattern } = useRules();
const { mapToProgramDeliveryTypeValues } = useProgram();
const editProgramForm = ref({} as VForm);
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
      hasWILComponent: programDetails.hasWILComponent as FormYesNoOptions,
      cipCode: programDetails.cipCode,
      nocCode: programDetails.nocCode,
      sabcCode: programDetails.sabcCode,
      programIntensity: programDetails.programIntensity,
      programDeliveryTypes: mapToProgramDeliveryTypeValues(
        programDetails.programDeliveryTypes,
      ),
      deliveredOnlineAlsoOnsite:
        programDetails.deliveredOnlineAlsoOnsite as FormYesNoOptions,
    };
    program.value = programDetails;
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
