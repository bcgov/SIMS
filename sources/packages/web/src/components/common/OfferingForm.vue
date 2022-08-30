<template>
  <!-- todo: ann form definition -->
  <formio-container
    formName="educationProgramOffering"
    :formData="formData"
    @submitted="saveOffering"
  >
    <template #actions="{ submit }" v-if="!readOnly">
      <!-- todo: processing logic not working -->
      <footer-buttons
        :processing="processing"
        primaryLabel="Submit"
        @primaryClick="submit"
      />
    </template>
  </formio-container>
</template>

<script lang="ts">
import { FormIOForm, OfferingFormModel } from "@/types";
import { SetupContext, computed, ref } from "vue";
import { useOffering } from "@/composables";
import { AuthService } from "@/services/AuthService";
import { EducationProgramOfferingAPIInDTO } from "@/services/http/dto";

export default {
  props: {
    data: {
      type: Object,
      required: true,
      default: {} as OfferingFormModel,
    },
    //For view only purpose where submit action not required.
    readOnly: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  emits: ["saveOffering"],
  setup(props: any, context: SetupContext) {
    const { mapOfferingChipStatus } = useOffering();
    const processing = ref(false);
    const saveOffering = (
      form: FormIOForm<EducationProgramOfferingAPIInDTO>,
    ) => {
      processing.value = true;
      context.emit("saveOffering", form.data);
      processing.value = false;
    };
    /**
     * The property clientType is populated for institution because
     * the form.io for education program offering has a logic at it's root level panel
     * to disable all the form inputs when clientType is not institution.
     * The below mentioned logic is added to the panel of the form to display the
     * form as read-only for ministry(AEST) user and also allow the hidden component values
     * to be calculated.
     *! If a form.io is loaded with readOnly attribute set to true, then the restricts
     *! hidden components to calculate it's value by design.
     */
    const formData = computed(
      (): OfferingFormModel => ({
        ...props.data,
        offeringChipStatus: props.data.offeringStatus
          ? mapOfferingChipStatus(props.data.offeringStatus)
          : undefined,
        offeringStatusToDisplay: props.data.offeringStatus,
        clientType: AuthService.shared.authClientType,
      }),
    );

    return {
      saveOffering,
      formData,
    };
  },
};
</script>
