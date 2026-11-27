<template>
  <formio-container form-name="noticeOfAssessment" :form-data="initialData" />
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { AssessmentNOAAPIOutDTO } from "@/services/http/dto";
import { useFormatters } from "@/composables";
import {
  ApplicationStatus,
  AssessmentStatus,
  DisbursementScheduleStatus,
} from "@/types";

enum MSFAAStatus {
  Pending = "pending",
  Signed = "signed",
  Cancelled = "cancelled",
}

/**
 * Dynamic data that must be inspected to render the
 * individual MSFAA statuses and appended properties
 * to be consumed by the form.io definition.
 */
export interface NOADisbursementSchedule {
  disbursement1Status: DisbursementScheduleStatus;
  disbursement1MSFAADateSigned: Date;
  disbursement1MSFAACancelledDate: Date;
  disbursement1MSFAACancelledDateFormatted: string;
  disbursement1MSFAAStatusClass: string;
  disbursement1MSFAAStatus: MSFAAStatus;
  disbursement2Status: DisbursementScheduleStatus;
  disbursement2MSFAADateSigned: Date;
  disbursement2MSFAACancelledDate: Date;
  disbursement2MSFAACancelledDateFormatted: string;
  disbursement2MSFAAStatusClass: string;
  disbursement2MSFAAStatus: MSFAAStatus;
}

/**
 * MSFAA success icon displayed when a MSFAA is not cancelled.
 */
const MSFAA_SUCCESS_CLASS = "fa-regular fa-check-circle text-success";
/**
 * MSFAA error icon displayed when the MSFAA is cancelled.
 */
const MSFAA_CANCELED_CLASS = "fa-regular fa-times-circle text-danger";

export default defineComponent({
  emits: {
    assessmentDataLoaded: (
      applicationStatus: ApplicationStatus,
      noaApprovalStatus: AssessmentStatus,
      applicationCurrentAssessmentId: number,
    ) => {
      return (
        !!applicationStatus &&
        !!noaApprovalStatus &&
        !!applicationCurrentAssessmentId
      );
    },
  },
  props: {
    assessmentId: {
      type: Number,
      required: true,
    },
    studentId: {
      type: Number,
      required: false,
      default: undefined,
    },
    applicationId: {
      type: Number,
      required: false,
      default: undefined,
    },
  },
  setup(props, { emit }) {
    const { dateOnlyLongString } = useFormatters();
    const initialData = ref({} as AssessmentNOAAPIOutDTO);

    /**
     * Defines the MSFAA status based on the signed date and cancelled dates.
     * @param signedDate signed date.
     * @param cancelledDate cancelled date.
     * @returns MSFAA status.
     */
    const getMSFAAStatus = (
      signedDate?: Date,
      cancelledDate?: Date,
    ): MSFAAStatus => {
      if (cancelledDate) {
        return MSFAAStatus.Cancelled;
      }
      return signedDate ? MSFAAStatus.Signed : MSFAAStatus.Pending;
    };

    /**
     * Defines the icon class to displayed depending on the MSFAA status.
     * @param msfaaStatus MSFAA status.
     * @returns MSFAA css classes to set the MSFAA status icon.
     */
    const getMSFAAStatusClass = (msfaaStatus: MSFAAStatus): string => {
      return msfaaStatus === MSFAAStatus.Cancelled
        ? MSFAA_CANCELED_CLASS
        : MSFAA_SUCCESS_CLASS;
    };

    const loadNOA = async () => {
      const assessment =
        await StudentAssessmentsService.shared.getAssessmentNOA(
          props.assessmentId,
          props.studentId,
          props.applicationId,
        );
      const noaDisbursementSchedule =
        assessment.disbursement as NOADisbursementSchedule;
      // Adjust disbursement schedules.
      // First disbursement.
      const firstMSFAAStatus = getMSFAAStatus(
        noaDisbursementSchedule.disbursement1MSFAADateSigned,
        noaDisbursementSchedule.disbursement1MSFAACancelledDate,
      );
      noaDisbursementSchedule.disbursement1MSFAAStatus = firstMSFAAStatus;
      noaDisbursementSchedule.disbursement1MSFAACancelledDateFormatted =
        dateOnlyLongString(
          noaDisbursementSchedule.disbursement1MSFAACancelledDate,
        );
      noaDisbursementSchedule.disbursement1MSFAAStatusClass =
        getMSFAAStatusClass(firstMSFAAStatus);
      // Second disbursement.
      const secondMSFAAStatus = getMSFAAStatus(
        noaDisbursementSchedule.disbursement2MSFAADateSigned,
        noaDisbursementSchedule.disbursement2MSFAACancelledDate,
      );
      noaDisbursementSchedule.disbursement2MSFAAStatus = secondMSFAAStatus;
      noaDisbursementSchedule.disbursement2MSFAACancelledDateFormatted =
        dateOnlyLongString(
          noaDisbursementSchedule.disbursement2MSFAACancelledDate,
        );
      noaDisbursementSchedule.disbursement2MSFAAStatusClass =
        getMSFAAStatusClass(secondMSFAAStatus);
      initialData.value = assessment;
      emit(
        "assessmentDataLoaded",
        initialData.value.applicationStatus,
        initialData.value.noaApprovalStatus,
        initialData.value.applicationCurrentAssessmentId,
      );
    };

    onMounted(loadNOA);

    return {
      initialData,
    };
  },
});
</script>
