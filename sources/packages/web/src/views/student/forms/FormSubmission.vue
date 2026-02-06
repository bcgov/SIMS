<!-- Allow the student to submit a new form. -->
<template>
  <student-page-container>
    <template #header>
      <header-navigator title="Student" :sub-title="referenceForm?.category" />
    </template>
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
      <form-submission-items
        :submission-items="formSubmissionItems"
        @submitted="submitted"
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
      </form-submission-items>
    </body-header-container>
  </student-page-container>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watchEffect } from "vue";
import {
  ApiProcessError,
  FormSubmissionItem,
  FormSubmissionItemSubmitted,
} from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import { useSnackBar } from "@/composables";
import { AppealApplicationDetailsAPIOutDTO } from "@/services/http/dto";
import FormSubmissionItems from "@/components/form-submissions/FormSubmissionItems.vue";
import { DynamicFormConfigurationService } from "@/services/DynamicFormConfigurationService";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { FormSubmissionsService } from "@/services/FormSubmissionsService";
import { useRouter } from "vue-router";

export default defineComponent({
  components: {
    FormSubmissionItems,
  },
  props: {
    formDefinitions: {
      type: Array as PropType<string[]>,
      required: true,
    },
    applicationId: {
      type: Number,
      default: null,
      required: false,
    },
  },
  setup(props) {
    const router = useRouter();
    const snackBar = useSnackBar();
    const formSubmissionItems = ref([] as FormSubmissionItem[]);
    const processing = ref(false);

    const referenceForm = computed(() => formSubmissionItems.value[0]);

    const submitted = async (items: FormSubmissionItemSubmitted[]) => {
      try {
        await FormSubmissionsService.shared.submitForm({
          applicationId: props.applicationId,
          items,
        });
        processing.value = true;
        snackBar.success("The student appeal has been submitted successfully.");
        router.push({
          name: StudentRoutesConst.STUDENT_APPEAL_HISTORY,
        });
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          snackBar.error(error.message);
          return;
        }
        snackBar.error(
          "An unexpected error happened while submitting the appeal.",
        );
      } finally {
        processing.value = false;
      }
    };

    watchEffect(async () => {
      let application: AppealApplicationDetailsAPIOutDTO | undefined =
        undefined;
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
          return;
        }
      }
      const formConfigurations =
        await DynamicFormConfigurationService.shared.getDynamicFormConfigurationsByCategory();
      formSubmissionItems.value = props.formDefinitions.map<FormSubmissionItem>(
        (formDefinition) => {
          const formConfiguration = formConfigurations.configurations.find(
            (form) => form.formDefinitionName === formDefinition,
          );
          if (!formConfiguration) {
            throw new Error("Invalid form configuration ID");
          }
          return {
            dynamicConfigurationId: formConfiguration.id,
            formType: formConfiguration.formType,
            category: formConfiguration.formCategory,
            formName: formConfiguration.formDefinitionName,
            formData: {
              programYear: application?.programYear,
              parents: application?.supportingUserParents,
            },
          };
        },
      );
    });

    return {
      referenceForm,
      formSubmissionItems,
      submitted,
      processing,
    };
  },
});
</script>
