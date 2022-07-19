<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Assessments"
        subTitle="View Submission"
        :routeLocation="assessmentsSummaryRoute"
      />
    </template>
    <template #sub-header>
      <header-title-value title="Submitted date" :value="submittedDate"
    /></template>
    <formio-container
      formName="studentExceptions"
      :formData="applicationExceptions"
      @submitted="submitted"
    >
      <template #actions="{ submit }" v-if="!readOnly">
        <footer-buttons
          :processing="processing"
          primaryLabel="Complete student request"
          @primaryClick="submit"
          @secondaryClick="gotToAssessmentsSummary"
        />
      </template>
    </formio-container>
  </full-page-container>
</template>
<script lang="ts">
import { ref, onMounted } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { ApplicationExceptionService } from "@/services/ApplicationExceptionService";
import { ApplicationExceptionStatus, FormIOForm } from "@/types";
import {
  ApplicationExceptionAPIOutDTO,
  UpdateApplicationExceptionAPIInDTO,
} from "@/services/http/dto";
import { useAssessment, useFormatters, useSnackBar } from "@/composables";
import HeaderTitleValue from "@/components/generic/HeaderTitleValue.vue";
import useEmitter from "@/composables/useEmitter";

/**
 * Model to be used to populate the form.io.
 */
type ApplicationExceptionFormModel = Omit<
  ApplicationExceptionAPIOutDTO,
  "assessedDate"
> & {
  /**
   * Exception status at the moment that the data was loaded.
   * used mainly when the form is being edited and change the
   * status to approved/declined should not change the status
   * that the form was originally loaded.
   */
  exceptionStatusOnLoad: ApplicationExceptionStatus;
  /**
   * Hides the assessedDate defined as a Date property
   * allowing the conversion to the correct string format
   * to be displayed in the UI.
   */
  assessedDate: string;
  /**
   * CSS class to be applied to the status chip.
   */
  exceptionStatusClass: string;
  /**
   * Simplification of the property exceptionRequests
   * for easy consumption inside form.io definition.
   */
  exceptionNames: string[];
};

export default {
  components: { HeaderTitleValue },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
    exceptionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const emitter = useEmitter();
    const router = useRouter();
    const toast = useSnackBar();
    const { dateOnlyLongString } = useFormatters();
    const { mapRequestAssessmentChipStatus } = useAssessment();
    const applicationExceptions = ref({} as ApplicationExceptionFormModel);
    const submittedDate = ref("");
    const processing = ref(false);
    const readOnly = ref(true);

    onMounted(async () => {
      const applicationException =
        await ApplicationExceptionService.shared.getExceptionById(
          props.exceptionId,
        );
      applicationExceptions.value = {
        ...applicationException,
        assessedDate: dateOnlyLongString(applicationException.assessedDate),
        exceptionStatusClass: mapRequestAssessmentChipStatus(
          applicationException.exceptionStatus,
        ),
        exceptionStatusOnLoad: applicationException.exceptionStatus,
        exceptionNames: applicationException.exceptionRequests.map(
          (exception) => exception.exceptionName,
        ),
      };
      submittedDate.value = dateOnlyLongString(
        applicationException.submittedDate,
      );
      readOnly.value =
        applicationException.exceptionStatus !==
        ApplicationExceptionStatus.Pending;
    });

    const assessmentsSummaryRoute = {
      name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
      params: {
        applicationId: props.applicationId,
        studentId: props.studentId,
      },
    };

    const gotToAssessmentsSummary = () => {
      router.push(assessmentsSummaryRoute);
    };

    const submitted = async (form: FormIOForm) => {
      processing.value = true;
      try {
        const approveExceptionPayload =
          form.data as UpdateApplicationExceptionAPIInDTO;
        await ApplicationExceptionService.shared.approveException(
          props.exceptionId,
          approveExceptionPayload,
        );
        emitter.emit(
          "snackBar",
          toast.success(
            `Application exception status is now ${approveExceptionPayload.exceptionStatus}.`,
          ),
        );
        gotToAssessmentsSummary();
      } catch (error: unknown) {
        emitter.emit(
          "snackBar",
          toast.error("An unexpected error happened during the approval."),
        );
      } finally {
        processing.value = false;
      }
    };

    return {
      gotToAssessmentsSummary,
      assessmentsSummaryRoute,
      applicationExceptions,
      submitted,
      submittedDate,
      processing,
      readOnly,
    };
  },
};
</script>
