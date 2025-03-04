<template>
  <formio-container
    formName="noticeOfAssessment"
    @customEvent="customEvent"
    :formData="initialData"
  />
  <confirm-modal
    title="Reissue MSFAA number"
    ref="confirmReissueMSFAA"
    okLabel="Reissue MSFAA number now"
    cancelLabel="Cancel"
    :loading="msfaaReissueProcessing"
    ><template #content>
      <p>
        <strong>Are you sure you want to proceed?</strong> Reissuing an MSFAA
        number will impact the student's pending disbursements meaning a new
        number will be provided for the pending disbursements. The student will
        still be able to see their cancelled MSFAA number on their Notice of
        Assessment.
      </p>
    </template></confirm-modal
  >
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect } from "vue";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { AssessmentNOAAPIOutDTO } from "@/services/http/dto";
import { ModalDialog, useFormatters } from "@/composables";
import ConfirmModal from "@/components/common/modals/ConfirmModal.vue";
import {
  ApplicationStatus,
  AssessmentStatus,
  DisbursementScheduleStatus,
  FormIOCustomEvent,
  FormIOCustomEventTypes,
  FormIOForm,
} from "@/types";

interface NoticeOfAssessment extends AssessmentNOAAPIOutDTO {
  canReissueMSFAA: boolean;
}

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
    reissueMSFAA: (
      applicationId: number,
      loadNOA: () => Promise<void>,
      processing: (processing: boolean) => void,
    ) => {
      return !!applicationId && !!loadNOA && !!processing;
    },
  },
  components: { ConfirmModal },
  props: {
    assessmentId: {
      type: Number,
      required: true,
    },
    canReissueMSFAA: {
      type: Boolean,
      default: false,
    },
    studentId: {
      type: Number,
      required: false,
    },
    applicationId: {
      type: Number,
      required: false,
    },
    // Used to validate if student and application
    // are required to load the NOA.
    validateStudentAndApplication: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const { dateOnlyLongString } = useFormatters();
    const confirmReissueMSFAA = ref({} as ModalDialog<boolean>);
    const initialData = ref({} as NoticeOfAssessment);
    const msfaaReissueProcessing = ref(false);

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
      // Checks if the component allows the MSFAA reissue and if there is
      // one pending disbursement with a cancelled MSFAA.
      const canReissueMSFAA =
        props.canReissueMSFAA &&
        ((noaDisbursementSchedule.disbursement1Status ===
          DisbursementScheduleStatus.Pending &&
          !!noaDisbursementSchedule.disbursement1MSFAACancelledDate) ||
          (noaDisbursementSchedule.disbursement2Status ===
            DisbursementScheduleStatus.Pending &&
            !!noaDisbursementSchedule.disbursement2MSFAACancelledDate));
      initialData.value = {
        ...assessment,
        canReissueMSFAA,
      };
      emit(
        "assessmentDataLoaded",
        initialData.value.applicationStatus,
        initialData.value.noaApprovalStatus,
        initialData.value.applicationCurrentAssessmentId,
      );
    };

    watchEffect(async () => {
      if (
        (props.validateStudentAndApplication &&
          props.studentId &&
          props.applicationId &&
          props.assessmentId) ||
        (!props.validateStudentAndApplication && props.assessmentId)
      ) {
        await loadNOA();
      }
    });

    const setMSFAAReissueProcessing = (processing: boolean) => {
      msfaaReissueProcessing.value = processing;
    };

    const customEvent = async (_form: FormIOForm, event: FormIOCustomEvent) => {
      if (event.type === FormIOCustomEventTypes.ReissueMSFAA)
        if (await confirmReissueMSFAA.value.showModal()) {
          emit(
            "reissueMSFAA",
            initialData.value.applicationId,
            () => loadNOA(),
            (processing) => setMSFAAReissueProcessing(processing),
          );
        }
    };

    return {
      confirmReissueMSFAA,
      msfaaReissueProcessing,
      customEvent,
      initialData,
    };
  },
});
</script>
