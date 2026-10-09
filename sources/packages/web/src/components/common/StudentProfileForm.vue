<template>
  <formio-container
    form-name="studentProfile"
    :form-data="formModel"
    :is-data-ready="isDataReady"
    @loaded="$emit('loaded', $event)"
    @submitted="$emit('submitted', $event)"
    @custom-event="$emit('customEvent', $event)"
  >
    <template #actions="{ submit }">
      <footer-buttons
        v-if="showActionButtons"
        :processing="processing"
        :disable-primary-button="isEmailMissing"
        @primary-click="submit"
        :primary-label="saveLabel"
        :show-secondary-button="false"
      />
    </template>
  </formio-container>
</template>

<script setup lang="ts">
import { computed, defineProps, defineEmits } from "vue";
import { StudentProfileFormModel, StudentProfileFormModes } from "@/types";

const props = defineProps<{
  formModel: StudentProfileFormModel;
  processing: boolean;
  isDataReady: boolean;
}>();

defineEmits(["submitted", "customEvent", "loaded"]);

const saveLabel = computed(() =>
  props.formModel.mode === StudentProfileFormModes.StudentEdit
    ? "Save profile"
    : "Create profile",
);

const showActionButtons = computed(
  () => props.formModel.mode !== StudentProfileFormModes.AESTAccountApproval,
);

// Email is mandatory for all users, the profile cannot be saved without it.
const isEmailMissing = computed(() => !props.formModel.email?.trim());
</script>
