<template>
  <formio-container
    formName="studentProfile"
    :formData="formModel"
    @submitted="$emit('submitted', $event)"
    @customEvent="$emit('customEvent', $event)"
  >
    <template #actions="{ submit }">
      <footer-buttons
        v-if="showActionButtons"
        :processing="processing"
        @primaryClick="submit"
        :primaryLabel="saveLabel"
        :showSecondaryButton="false"
      />
    </template>
  </formio-container>
</template>

<script lang="ts">
import { ref, computed, PropType } from "vue";
import { StudentProfileFormModel, StudentProfileFormModes } from "@/types";

export default {
  emits: ["submitted", "customEvent"],
  props: {
    formModel: {
      type: Object as PropType<StudentProfileFormModel>,
      required: true,
      default: {} as StudentProfileFormModel,
    },
    processing: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  setup(props: any) {
    const initialData = ref({} as StudentProfileFormModel);

    const saveLabel = computed(() =>
      props.formModel.mode === StudentProfileFormModes.StudentEdit
        ? "Save profile"
        : "Create profile",
    );

    const showActionButtons = computed(
      () =>
        props.formModel.mode !== StudentProfileFormModes.AESTAccountApproval,
    );

    return {
      initialData,
      saveLabel,
      showActionButtons,
    };
  },
};
</script>
