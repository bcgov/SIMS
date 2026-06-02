<template>
  <detail-header :header-map="headerMap" />
</template>

<script setup lang="ts">
import { computed, PropType, ref, watchEffect } from "vue";
import {
  ApplicationSupplementalDataAPIOutDTO,
  FormSubmissionAPIOutDTO,
  FormSubmissionMinistryAPIOutDTO,
} from "@/services/http/dto";
import DetailHeader from "@/components/generic/DetailHeader.vue";
import { FormCategory, FormSubmissionItem } from "@/types";
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
    type: Object as PropType<FormSubmissionItem>,
    required: false,
    default: undefined,
  },
});

const headerMap = computed((): Record<string, string | undefined> => {
  const formCategory =
    props.formSubmissionItem?.category ??
    formSubmissionData?.value?.submissionItems?.at(0)?.formCategory;
  const formType =
    props.formSubmissionItem?.formType ??
    formSubmissionData?.value?.submissionItems?.at(0)?.formType;
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
    "Form name": applicationData.value ? undefined : formType,
    "Form type":
      formCategory === FormCategory.StudentAppeal ? "Appeal" : "Form",
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
