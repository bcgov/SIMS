<template>
  <formio-container
    formName="studentProfile"
    :formData="formModel"
    :is-data-ready="isDataReady"
    @loaded="$emit('loaded', $event)"
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
import { ref, computed, PropType, defineComponent } from "vue";
import { StudentProfileFormModel, StudentProfileFormModes } from "@/types";

export default defineComponent({
  emits: ["submitted", "customEvent", "loaded"],
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
    isDataReady: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
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
});
</script>
