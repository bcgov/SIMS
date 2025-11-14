<!-- Appeals submission, should not be confused with "legacy appeals" (a.k.a. "change request"). -->
<template>
  <body-header-container>
    <template #header>
      <body-header title="Complete all question(s) below">
        <template #subtitle>
          All requested changes will be reviewed by StudentAid BC after you
          submit for review.
          <slot name="submit-appeal-header"> </slot>
        </template>
      </body-header>
    </template>
    <appeal-requests-form
      :student-appeal-requests="appealRequestsForms"
      @submitted="$emit('submitted', $event)"
    >
      <template #actions="{ submit }">
        <footer-buttons
          justify="space-between"
          :processing="processing"
          @secondary-click="$.emit('cancel')"
          secondary-label="Back"
          @primary-click="submit"
          primary-label="Submit for review"
        ></footer-buttons>
      </template>
    </appeal-requests-form>
  </body-header-container>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watchEffect } from "vue";
import { StudentAppealRequest } from "@/types";
import AppealRequestsForm from "@/components/common/AppealRequestsForm.vue";
import { ApplicationService } from "@/services/ApplicationService";
import { useSnackBar } from "@/composables";
import { ApplicationProgramYearAPIOutDTO } from "@/services/http/dto";

export default defineComponent({
  emits: {
    cancel: null,
    submitted: (appealRequests: StudentAppealRequest[]) =>
      !!appealRequests.length,
  },
  components: {
    AppealRequestsForm,
  },
  props: {
    appealForms: {
      type: Array as PropType<string[]>,
      required: true,
    },
    applicationId: {
      type: Number,
      default: null,
      required: false,
    },
    processing: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  setup(props) {
    const snackBar = useSnackBar();
    const appealRequestsForms = ref([] as StudentAppealRequest[]);

    watchEffect(async () => {
      let application: ApplicationProgramYearAPIOutDTO;
      if (props.applicationId) {
        try {
          application =
            await ApplicationService.shared.getApplicationForRequestChange(
              props.applicationId,
            );
        } catch {
          snackBar.error(
            "An unexpected error happened while retrieving the application to submit the request for change.",
          );
        }
      }
      appealRequestsForms.value = props.appealForms.map((formName) => ({
        formName,
        data: { programYear: application?.programYear },
        files: [],
      }));
    });

    return {
      appealRequestsForms,
    };
  },
});
</script>
