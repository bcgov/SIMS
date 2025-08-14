<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Assessments"
        subTitle="View request(s)"
        :routeLocation="backRouteLocation"
      />
      <application-header-title :application-id="applicationId" />
    </template>
    <template #sub-header>
      <header-title-value title="Submitted date" :value="submittedDate"
    /></template>
    <formio-container
      formName="studentExceptions"
      :formData="applicationExceptions"
      :readOnly="readOnlyForm"
      @submitted="$emit('submitted', $event)"
    >
      <template #actions="{ submit }" v-if="!readOnly">
        <check-permission-role :role="Role.StudentApproveDeclineExceptions">
          <template #="{ notAllowed }">
            <footer-buttons
              :processing="processing"
              primaryLabel="Complete student request"
              :disablePrimaryButton="notAllowed"
              @primaryClick="submit"
              @secondaryClick="gotToAssessmentsSummary"
            />
          </template>
        </check-permission-role>
      </template>
    </formio-container>
  </full-page-container>
</template>
<script lang="ts">
import { ref, onMounted, defineComponent, PropType } from "vue";
import { RouteLocationRaw, useRouter } from "vue-router";
import { ApplicationExceptionService } from "@/services/ApplicationExceptionService";
import { ApplicationExceptionStatus, FormIOForm, Role } from "@/types";
import {
  DetailedApplicationExceptionAPIOutDTO,
  UpdateApplicationExceptionAPIInDTO,
} from "@/services/http/dto";
import { useAssessment, useFormatters } from "@/composables";
import HeaderTitleValue from "@/components/generic/HeaderTitleValue.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import ApplicationHeaderTitle from "@/components/aest/students/ApplicationHeaderTitle.vue";

/**
 * Model to be used to populate the form.io.
 */
interface ApplicationExceptionFormModel {
  /**
   * Current exception status.
   */
  exceptionStatus: ApplicationExceptionStatus;
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
   * Description of exceptions that were requested to be approved.
   */
  requestedForApproval: string[];
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
    const router = useRouter();
    const { dateOnlyLongString } = useFormatters();
    const { mapRequestAssessmentChipStatus } = useAssessment();
    const applicationExceptions = ref({} as ApplicationExceptionFormModel);
    const submittedDate = ref("");
    const readOnly = ref(true);

    onMounted(async () => {
      const applicationException =
        await ApplicationExceptionService.shared.getExceptionDetails<DetailedApplicationExceptionAPIOutDTO>(
          props.exceptionId,
          props.studentId,
          props.applicationId,
        );
      // Description of exceptions that were submitted for
      // the first time to be assessed.
      const requestedForApproval = applicationException.exceptionRequests
        .filter((request) => !request.previouslyApprovedOn)
        .map((request) => request.exceptionDescription);
      // Descriptions of exceptions that were submitted and
      // approved in some of the previous application versions.
      const previouslyApprovedRequests = applicationException.exceptionRequests
        .filter((request) => !!request.previouslyApprovedOn)
        .map(
          (request) =>
            `${request.exceptionDescription} on (${dateOnlyLongString(
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
        requestedForApproval,
        previouslyApprovedRequests,
        exceptionStatusOnLoad: applicationException.exceptionStatus,
        exceptionStatus: applicationException.exceptionStatus,
        showStaffApproval: props.showStaffApproval,
      };
      submittedDate.value = dateOnlyLongString(
        applicationException.submittedDate,
      );
      readOnly.value =
        applicationException.exceptionStatus !==
          ApplicationExceptionStatus.Pending || props.readOnlyForm;
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
    };
  },
});
</script>
