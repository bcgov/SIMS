<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Assessments"
        sub-title="View request(s)"
        :route-location="backRouteLocation"
      />
      <application-header-title :application-id="applicationId" />
    </template>
    <template #sub-header>
      <header-title-value title="Submitted date" :value="submittedDate"
    /></template>
    <formio-container
      form-name="studentExceptions"
      :form-data="applicationExceptions"
      :read-only="readOnly"
      @submitted="$emit('submitted', $event)"
      :is-data-ready="isDataReady"
    >
      <template #actions="{ submit }" v-if="!readOnly">
        <check-permission-role :role="Role.StudentApproveDeclineExceptions">
          <template #="{ notAllowed }">
            <footer-buttons
              :processing="processing"
              primary-label="Complete student request"
              :disable-primary-button="notAllowed"
              @primary-click="submit"
              @secondary-click="gotToAssessmentsSummary"
            />
          </template>
        </check-permission-role>
      </template>
    </formio-container>
  </full-page-container>
</template>
<script lang="ts">
import { ref, defineComponent, PropType, watchEffect } from "vue";
import { RouteLocationRaw, useRouter } from "vue-router";
import { ApplicationExceptionService } from "@/services/ApplicationExceptionService";
import {
  ApplicationExceptionRequestStatus,
  ApplicationExceptionStatus,
  FormIOForm,
  Role,
} from "@/types";
import {
  DetailedApplicationExceptionAPIOutDTO,
  UpdateApplicationExceptionAPIInDTO,
} from "@/services/http/dto";
import { useAssessment, useFormatters, useSnackBar } from "@/composables";
import HeaderTitleValue from "@/components/generic/HeaderTitleValue.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import ApplicationHeaderTitle from "@/components/aest/students/ApplicationHeaderTitle.vue";

/**
 * Model to be used to populate the form.io.
 */
interface ApplicationExceptionFormModel {
  /**
   * Exception status at the moment that the data was loaded.
   * used mainly when the form is being edited and change the
   * status to approved/declined should not change the status
   * that the form was originally loaded.
   */
  exceptionStatusOnLoad: ApplicationExceptionStatus;
  /**
   * Formatted date when the exception was approved.
   */
  assessedDate: string;
  /**
   * User that approved the exception.
   */
  assessedByUserName: string;
  /**
   * Assessment notes.
   */
  noteDescription: string;
  /**
   * CSS class to be applied to the status chip.
   */
  exceptionStatusClass: string;
  /**
   * ShowStaffApproval will decide if the staff approval section should
   * be hidden or not.
   */
  showStaffApproval: boolean;
  /**
   * Exception requests that were requested to be approved.
   */
  approvalExceptionRequests: {
    exceptionRequestId: number;
    exceptionDescription: string;
    exceptionRequestStatus: ApplicationExceptionRequestStatus;
  }[];
  /**
   * Description of the previously approved exceptions.
   */
  previouslyApprovedRequests: string[];
}

export default defineComponent({
  emits: {
    submitted: (form: FormIOForm<UpdateApplicationExceptionAPIInDTO>) => {
      return !!form;
    },
  },
  components: { HeaderTitleValue, CheckPermissionRole, ApplicationHeaderTitle },
  props: {
    studentId: {
      type: Number,
      required: false,
      default: undefined,
    },
    exceptionId: {
      type: Number,
      required: true,
    },
    backRouteLocation: {
      type: Object as PropType<RouteLocationRaw>,
      required: true,
    },
    processing: {
      type: Boolean,
      required: false,
      default: false,
    },
    readOnlyForm: {
      type: Boolean,
      required: false,
      default: false,
    },
    showStaffApproval: {
      type: Boolean,
      required: false,
      default: false,
    },
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const snackBar = useSnackBar();
    const router = useRouter();
    const { dateOnlyLongString } = useFormatters();
    const { mapRequestAssessmentChipStatus } = useAssessment();
    const applicationExceptions = ref({} as ApplicationExceptionFormModel);
    const submittedDate = ref("");
    const readOnly = ref(true);
    const isDataReady = ref(false);

    watchEffect(async () => {
      try {
        isDataReady.value = false;
        const applicationException =
          await ApplicationExceptionService.shared.getExceptionDetails<DetailedApplicationExceptionAPIOutDTO>(
            props.exceptionId,
            props.studentId,
            props.applicationId,
          );
        // Description of exceptions that were submitted for
        // the first time to be assessed.
        const approvalExceptionRequests = applicationException.exceptionRequests
          .filter((request) => !request.previouslyApprovedOn)
          .map((request) => ({
            exceptionRequestId: request.exceptionRequestId,
            exceptionDescription: request.exceptionDescription,
            exceptionRequestStatus: request.exceptionRequestStatus,
          }));
        // Descriptions of exceptions that were submitted and
        // approved in some of the previous application versions.
        const previouslyApprovedRequests =
          applicationException.exceptionRequests
            .filter((request) => !!request.previouslyApprovedOn)
            .map(
              (request) =>
                `${
                  request.exceptionDescription
                } (approved on ${dateOnlyLongString(
                  request.previouslyApprovedOn,
                )})`,
            );
        applicationExceptions.value = {
          assessedByUserName: applicationException.assessedByUserName,
          assessedDate: dateOnlyLongString(applicationException.assessedDate),
          noteDescription: applicationException.noteDescription,
          exceptionStatusClass: mapRequestAssessmentChipStatus(
            applicationException.exceptionStatus,
          ),
          approvalExceptionRequests,
          previouslyApprovedRequests,
          exceptionStatusOnLoad: applicationException.exceptionStatus,
          showStaffApproval: props.showStaffApproval,
        };
        submittedDate.value = dateOnlyLongString(
          applicationException.submittedDate,
        );
        readOnly.value =
          applicationException.exceptionStatus !==
            ApplicationExceptionStatus.Pending || props.readOnlyForm;
        isDataReady.value = true;
      } catch {
        snackBar.error(
          "Unexpected error while loading the student application exceptions.",
        );
      }
    });

    const gotToAssessmentsSummary = () => {
      router.push(props.backRouteLocation);
    };

    return {
      gotToAssessmentsSummary,
      applicationExceptions,
      submittedDate,
      readOnly,
      Role,
      isDataReady,
    };
  },
});
</script>
