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

<script lang="ts">
import { ref, computed, PropType, defineComponent } from "vue";
import { StudentProfileFormModel, StudentProfileFormModes } from "@/types";

export default defineComponent({
  emits: ["submitted", "customEvent", "loaded"],
  props: {
    formModel: {
      type: Object as PropType<StudentProfileFormModel>,
      required: true,
    },
    processing: {
      type: Boolean,
      required: true,
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
