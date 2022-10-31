<template>
  <formio-container
    formName="educationProgramOffering"
    :formData="formData"
    @submitted="submitOffering"
  >
    <template #actions="{ submit }" v-if="!readOnly">
      <footer-buttons
        justify="space-between"
        :processing="processing"
        primaryLabel="Submit"
        @primaryClick="submit"
        @secondaryClick="cancel"
        class="mx-0"
      >
        <template #primary-buttons="{ disabled }">
          <span>
            <v-btn
              :disabled="disabled"
              variant="elevated"
              data-cy="offeringValidationButton"
              color="primary"
              @click="submit({ validationOnly: true })"
              prepend-icon="fa:fa fa-check"
              >Validate
            </v-btn>
            <v-btn
              :disabled="disabled"
              class="ml-2"
              variant="elevated"
              data-cy="offeringSubmitButton"
              color="primary"
              @click="submit({ validationOnly: false })"
              >{{ submitLabel }}
            </v-btn>
          </span>
        </template>
      </footer-buttons>
    </template>
  </formio-container>
</template>

<script lang="ts">
import { FormIOForm, OfferingFormModel } from "@/types";
import { defineComponent, PropType, computed } from "vue";
import { useOffering } from "@/composables";
import { AuthService } from "@/services/AuthService";
import { EducationProgramOfferingAPIInDTO } from "@/services/http/dto";

interface SubmitArgs {
  validationOnly: true;
}

export default defineComponent({
  emits: ["validateOffering", "saveOffering", "cancel"],
  props: {
    data: {
      type: Object as PropType<OfferingFormModel>,
      required: true,
      default: {} as OfferingFormModel,
    },
    //For view only purpose where submit action not required.
    readOnly: {
      type: Boolean,
      required: false,
      default: true,
    },
    submitLabel: {
      type: String,
      required: false,
      default: "Submit",
    },
    processing: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  setup(props, context) {
    const { mapOfferingChipStatus } = useOffering();

    const submitOffering = (
      form: FormIOForm<EducationProgramOfferingAPIInDTO>,
      args: SubmitArgs,
    ) => {
      if (args.validationOnly) {
        context.emit("validateOffering", form.data);
      } else {
        context.emit("saveOffering", form.data);
      }
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

    const cancel = () => {
      context.emit("cancel");
    };

    return {
      submitOffering,
      formData,
      cancel,
    };
  },
});
</script>
