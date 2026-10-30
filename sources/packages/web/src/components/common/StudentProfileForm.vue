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

interface Props {
  formModel: StudentProfileFormModel;
  processing: boolean;
  isDataReady: boolean;
}

const props = defineProps<Props>();

defineEmits(["submitted", "customEvent", "loaded"]);

const saveLabel = computed(() =>
  props.formModel.mode === StudentProfileFormModes.StudentEdit
    ? "Save profile"
    : "Create profile",
);

const showActionButtons = computed(
  () => props.formModel.mode !== StudentProfileFormModes.AESTAccountApproval,
);
</script>
