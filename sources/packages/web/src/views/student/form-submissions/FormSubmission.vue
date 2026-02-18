<!-- Allow the student to submit a new form. -->
<template>
  <student-page-container>
    <template #header>
      <header-navigator
        title="Forms"
        :sub-title="referenceForm?.category"
        :route-location="backRouteLocation"
      />
    </template>
    <body-header-container>
      <template #header>
        <body-header title="Complete all question(s) below">
          <template #subtitle>
            All requested changes will be reviewed by StudentAid BC after you
            submit for review.
          </template>
        </body-header>
      </template>
      <form-submission-items
        :submission-items="formSubmissionItems"
        :application-id="applicationId"
        @submitted="submitted"
      >
        <template #actions="{ submit, allFormsLoaded }">
          <footer-buttons
            justify="space-between"
            :processing="processing"
            @secondary-click="cancel"
            secondary-label="Back"
            @primary-click="submit"
            primary-label="Submit for review"
            :disable-primary-button="!allFormsLoaded"
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
import { useSnackBar } from "@/composables";
import FormSubmissionItems from "@/components/form-submissions/FormSubmissionItems.vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { FormSubmissionService } from "@/services/FormSubmissionService";

export default defineComponent({
  components: {
    FormSubmissionItems,
  },
  props: {
    formDefinitionIds: {
      type: Array as PropType<number[]>,
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
        processing.value = true;
        await FormSubmissionService.shared.submitForm({
          applicationId: props.applicationId,
          items,
        });
        snackBar.success("The student form has been submitted successfully.");
        router.push({
          name: StudentRoutesConst.STUDENT_FORMS_HISTORY,
        });
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          snackBar.error(error.message);
          return;
        }
        snackBar.error(
          "An unexpected error happened while submitting the form.",
        );
      } finally {
        processing.value = false;
      }
    };

    watchEffect(async () => {
      const formConfigurations =
        await FormSubmissionService.shared.getSubmissionForms();
      formSubmissionItems.value =
        props.formDefinitionIds.map<FormSubmissionItem>((formDefinitionId) => {
          const formConfiguration = formConfigurations.configurations.find(
            (form) => form.id === formDefinitionId,
          );
          if (!formConfiguration) {
            snackBar.error(
              "An unexpected error occurred loading a form configuration.",
            );
            throw new Error("Invalid form configuration ID.");
          }
          return {
            dynamicConfigurationId: formConfiguration.id,
            formType: formConfiguration.formType,
            category: formConfiguration.formCategory,
            formName: formConfiguration.formDefinitionName,
            formData: {},
          };
        });
    });

    const backRouteLocation = computed(() => ({
      name: StudentRoutesConst.STUDENT_FORMS_SELECTOR,
      query: props.applicationId
        ? {
            applicationId: props.applicationId,
          }
        : undefined,
    }));

    const cancel = () => {
      router.push(backRouteLocation.value);
    };

    return {
      referenceForm,
      backRouteLocation,
      formSubmissionItems,
      submitted,
      processing,
      cancel,
    };
  },
});
</script>
