<template>
  <detail-header :header-map="headerMap" />
</template>

<script setup lang="ts">
import { computed, PropType, ref, watchEffect } from "vue";
import {
  ApplicationSupplementalDataAPIOutDTO,
  FormSubmissionAPIOutDTO,
  FormSubmissionItemAPIOutDTO,
  FormSubmissionMinistryAPIOutDTO,
} from "@/services/http/dto";
import DetailHeader from "@/components/generic/DetailHeader.vue";
import { FormCategory } from "@/types";
import { useFormatters } from "@/composables";
import { ApplicationService } from "@/services/ApplicationService";

const { dateOnlyLongPeriodString, dateOnlyLongString } = useFormatters();

const applicationData = ref<ApplicationSupplementalDataAPIOutDTO>();
const formSubmissionData = ref<
  FormSubmissionMinistryAPIOutDTO | FormSubmissionAPIOutDTO
>();
const props = defineProps({
  formSubmission: {
    type: Object as PropType<
      FormSubmissionMinistryAPIOutDTO | FormSubmissionAPIOutDTO
    >,
    required: false,
    default: undefined,
  },
  applicationId: {
    type: Number,
    required: false,
    default: undefined,
  },
  formSubmissionItem: {
    type: Object as PropType<FormSubmissionItemAPIOutDTO>,
    required: false,
    default: undefined,
  },
});

const headerMap = computed((): Record<string, string | undefined> => {
  const referenceForm =
    props.formSubmissionItem ??
    formSubmissionData?.value?.submissionItems?.at(0);
  const studyDates = applicationData.value
    ? dateOnlyLongPeriodString(
        applicationData.value.applicationStartDate,
        applicationData.value.applicationEndDate,
      )
    : undefined;
  const formSubmissionDate = formSubmissionData.value
    ? dateOnlyLongString(formSubmissionData.value?.submittedDate)
    : undefined;
  return {
    Name: props.formSubmission?.studentFullName,
    "Application #": applicationData.value?.applicationNumber,
    Institution: applicationData.value?.applicationInstitutionName,
    "Study dates": studyDates,
    "Form name": applicationData.value ? undefined : referenceForm?.formType,
    "Form type":
      referenceForm?.formCategory === FormCategory.StudentAppeal
        ? "Appeal"
        : "Form",
    "Form submission date": formSubmissionDate,
  };
});

const loadValues = async () => {
  if (props.formSubmission) {
    formSubmissionData.value = props.formSubmission;
  }

  const applicationId =
    props.applicationId ?? formSubmissionData.value?.applicationId;
  if (applicationId) {
    applicationData.value = await ApplicationService.shared.getApplication(
      applicationId,
      {
        loadDynamicData: false,
      },
    );
  }
};
// Adding watch effect instead of onMounted because
// formSubmissionId may not be available on load.
watchEffect(async () => await loadValues());
</script>
