<!-- Allow an Institution to see a form submitted by the student. -->
<template>
  <student-page-container>
    <template #header>
      <header-navigator
        title="Forms"
        :sub-title="subtitle"
        :back-target="backTarget"
      />
    </template>
    <body-header-container>
      <template #header>
        <body-header :title="formSubmission?.formCategory">
          <template #status-chip>
            <status-chip-form-submission
              v-if="formSubmission && !loading"
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
      <content-group>
        <form-submission-items
          :submission-items="formSubmissionItems"
          :loading="loading"
          :read-only="true"
        >
          <template
            #decision="{ decision }"
            v-if="formSubmission?.status !== FormSubmissionStatus.Pending"
          >
            <h4 class="category-header-medium brand-gray-text">
              Decision notes
            </h4>
            <v-divider />
            <v-sheet color="grey-lighten-4 p-3" rounded border>
              <p>
                {{ decision.noteDescription }}
              </p>
            </v-sheet>
          </template>
        </form-submission-items>
      </content-group>
    </body-header-container>
  </student-page-container>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watchEffect } from "vue";
import FormSubmissionItems from "@/components/form-submissions/FormSubmissionItems.vue";
import { FormSubmissionService } from "@/services/FormSubmissionService";
import {
  BackTarget,
  FormCategory,
  FormSubmissionItem,
  FormSubmissionItemDecision,
  FormSubmissionStatus,
} from "@/types";
import { FormSubmissionAPIOutDTO } from "@/services/http/dto";
import {
  InstitutionRoutesConst,
  StudentRoutesConst,
} from "@/constants/routes/RouteConstants";
import { useSnackBar } from "@/composables";
import StatusChipFormSubmission from "@/components/generic/StatusChipFormSubmission.vue";

export default defineComponent({
  components: {
    FormSubmissionItems,
    StatusChipFormSubmission,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    formSubmissionId: {
      type: Number,
      required: true,
    },
    backTarget: {
      type: Object as PropType<BackTarget>,
      required: true,
    },
  },
  setup(props) {
    const snackBar = useSnackBar();
    const formSubmission = ref<FormSubmissionAPIOutDTO>();
    const formSubmissionItems = ref(
      [] as FormSubmissionItem<FormSubmissionItemDecision>[],
    );
    const loading = ref(true);

    const subtitle = computed(() =>
      formSubmission.value?.formCategory === FormCategory.StudentAppeal
        ? "Appeal submission"
        : "Form submission",
    );

    watchEffect(async () => {
      try {
        loading.value = true;
        // Submission data.
        const submission =
          (await FormSubmissionService.shared.getFormSubmission(
            props.formSubmissionId,
            { studentId: props.studentId },
          )) as FormSubmissionAPIOutDTO;
        formSubmission.value = submission;

        // Convert submission items to be displayed.
        formSubmissionItems.value = submission.submissionItems.map<
          FormSubmissionItem<FormSubmissionItemDecision>
        >((item) => ({
          dynamicConfigurationId: item.dynamicFormConfigurationId,
          formData: item.submissionData,
          category: item.formCategory,
          formType: item.formType,
          formName: item.formDefinitionName,
          files: [],
          decision: {
            decisionStatus: item.currentDecision.decisionStatus,
            noteDescription: item.currentDecision.decisionNoteDescription,
          },
        }));
      } catch {
        snackBar.error("Error while loading form submission data.");
      } finally {
        loading.value = false;
      }
    });

    return {
      subtitle,
      formSubmissionItems,
      StudentRoutesConst,
      loading,
      formSubmission,
      InstitutionRoutesConst,
      FormSubmissionStatus,
    };
  },
});
</script>
