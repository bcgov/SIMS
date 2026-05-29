<template>
  <detail-header :header-map="headerMap" />
</template>

<script setup lang="ts">
import { PropType, ref, watchEffect } from "vue";
import {
  ApplicationSupplementalDataAPIOutDTO,
  FormSubmissionAPIOutDTO,
  FormSubmissionMinistryAPIOutDTO,
} from "@/services/http/dto";
import DetailHeader from "@/components/generic/DetailHeader.vue";
import { FormCategory, FormSubmissionItem } from "@/types";
import { FormSubmissionService } from "@/services/FormSubmissionService";
import { useFormatters } from "@/composables";
import { ApplicationService } from "@/services/ApplicationService";

const { dateOnlyLongPeriodString, dateOnlyLongString } = useFormatters();

const applicationData = ref<ApplicationSupplementalDataAPIOutDTO>();
const formSubmissionData = ref<
  FormSubmissionMinistryAPIOutDTO | FormSubmissionAPIOutDTO
>();
const props = defineProps({
  formSubmissionId: {
    type: Number,
    required: false,
    default: undefined,
  },
  applicationId: {
    type: Number,
    required: false,
    default: undefined,
  },
  formSubmissionItems: {
    type: Array as PropType<FormSubmissionItem[]>,
    required: false,
    default: undefined,
  },
});

const headerMap = ref<Record<string, string | undefined>>({});

const mapValues = (): Record<string, string | undefined> => {
  let formName: string | undefined = undefined;
  let studentFullName: string | undefined = undefined;
  let formCategory: FormCategory | undefined =
    props.formSubmissionItems?.at(0)?.category;
  if (formSubmissionData.value) {
    studentFullName = formSubmissionData.value.studentFullName;
    formCategory = formSubmissionData.value?.formCategory;
  }
  let studyDates: string | undefined = undefined;
  if (applicationData.value) {
    studentFullName = applicationData.value.studentFullName;
    studyDates = dateOnlyLongPeriodString(
      applicationData.value?.applicationStartDate,
      applicationData.value?.applicationEndDate,
    );
  } else {
    // Form name is only displayed if no application data is available (forms or other appeals)
    formName =
      formSubmissionData.value?.submissionItems?.at(0)?.formType ??
      props.formSubmissionItems?.at(0)?.formType;
  }

  let formType: string | undefined = undefined;
  if (formCategory) {
    formType = formCategory === FormCategory.StudentAppeal ? "Appeal" : "Form";
  }
  return {
    Name: studentFullName,
    "Application #": applicationData.value?.applicationNumber,
    Institution: applicationData.value?.applicationInstitutionName,
    "Study dates": studyDates,
    "Form name": formName,
    "Form type": formType,
    "Form submission date": dateOnlyLongString(
      formSubmissionData.value?.submittedDate,
    ),
  };
};

const loadValues = async () => {
  if (props.formSubmissionId) {
    formSubmissionData.value =
      await FormSubmissionService.shared.getFormSubmission(
        props.formSubmissionId,
      );
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
  headerMap.value = mapValues();
};
// Adding watch effect instead of onMounted because
// formSubmissionId may not be available on load.
watchEffect(async () => await loadValues());
</script>
