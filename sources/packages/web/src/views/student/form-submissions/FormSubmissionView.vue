<!-- Allow the student to see a submitted form. -->
<template>
  <student-page-container>
    <template #header>
      <header-navigator
        title="Forms"
        sub-title="Forms submission"
        :route-location="{
          name: StudentRoutesConst.STUDENT_FORMS_HISTORY,
        }"
        :back-target="backTarget"
      />
    </template>
    <body-header-container>
      <template #header>
        <body-header :title="formSubmission?.formCategory">
          <template #status-chip>
            <status-chip-form-submission
              v-if="formSubmission"
              :status="formSubmission.status"
            />
          </template>
          <template #subtitle>
            Please see below the list of form(s) submitted in this request. If
            multiple are present, the process will be completed once all items
            have a final decision associated and the Ministry user mark it as
            completed.
          </template>
        </body-header>
      </template>
      <form-submission-items
        :submission-items="formSubmissionItems"
        :read-only="true"
      >
        <template #actions>
          <footer-buttons
            :show-primary-button="false"
            secondary-label="Back"
            @secondary-click="goBack"
        /></template>
      </form-submission-items>
    </body-header-container>
  </student-page-container>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watchEffect } from "vue";
import FormSubmissionItems from "@/components/form-submissions/FormSubmissionItems.vue";
import { useRouter } from "vue-router";
import { FormSubmissionService } from "@/services/FormSubmissionService";
import { BackTarget, FormSubmissionItem } from "@/types";
import { FormSubmissionAPIOutDTO } from "@/services/http/dto";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useSnackBar } from "@/composables";
import StatusChipFormSubmission from "@/components/generic/StatusChipFormSubmission.vue";

export default defineComponent({
  components: {
    FormSubmissionItems,
    StatusChipFormSubmission,
  },
  props: {
    formSubmissionId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: false,
      default: undefined,
    },
    backTarget: {
      type: Object as PropType<BackTarget>,
      required: false,
      default: undefined,
    },
  },
  setup(props) {
    const snackBar = useSnackBar();
    const router = useRouter();
    const formSubmission = ref<FormSubmissionAPIOutDTO>();
    const formSubmissionItems = ref([] as FormSubmissionItem[]);
    const processing = ref(false);

    const goBack = () => {
      router.push({
        name: StudentRoutesConst.STUDENT_FORMS_HISTORY,
      });
    };

    watchEffect(async () => {
      try {
        // Submission data.
        const submission =
          (await FormSubmissionService.shared.getFormSubmission(
            props.formSubmissionId,
          )) as FormSubmissionAPIOutDTO;
        formSubmission.value = submission;

        // Convert submission items to be displayed.
        formSubmissionItems.value =
          submission.submissionItems.map<FormSubmissionItem>(
            (item) =>
              ({
                dynamicConfigurationId: item.dynamicFormConfigurationId,
                formData: item.submissionData,
                category: item.formCategory,
                formType: item.formType,
                formName: item.formDefinitionName,
                files: [],
              }) as FormSubmissionItem,
          );
      } catch {
        snackBar.error("Error while loading form submission data.");
      }
    });

    return {
      formSubmissionItems,
      StudentRoutesConst,
      processing,
      formSubmission,
      goBack,
    };
  },
});
</script>
