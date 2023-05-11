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
    ><template #content
      ><span class="font-bold">Are you sure you want to proceed?</span>
      <p class="mt-5">
        Reissuing an MSFAA number will impact the student's pending
        disbursements meaning a new number will be provided for the pending
        disbursements. The student will still be able to see their cancelled
        MSFAA number on their Notice of Assessment.
      </p>
    </template></confirm-modal
  >
</template>

<script lang="ts">
import { watch, defineComponent, ref, onMounted } from "vue";
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
  viewOnly?: boolean;
  canReissueMSFAA: boolean;
}

export interface NOADisbursementSchedule {
  disbursement1Status: string;
  disbursement1MSFAACancelledDate: string;
  disbursement1MSFAACancelledDateFormatted: string;
  disbursement1MSFAAStatusClass: string;
  disbursement2Status: string;
  disbursement2MSFAACancelledDate: string;
  disbursement2MSFAACancelledDateFormatted: string;
  disbursement2MSFAAStatusClass: string;
}

const MSFAA_SUCCESS_CLASS = "fa fa-check-circle text-success";
const MSFAA_CANCELED_CLASS = "fa fa-times-circle text-danger";

export default defineComponent({
  emits: {
    assessmentDataLoaded: (
      applicationStatus: ApplicationStatus,
      noaApprovalStatus: AssessmentStatus,
    ) => {
      return !!applicationStatus && !!noaApprovalStatus;
    },
    reissueMSFAA: (applicationId: number, loadNOA: () => Promise<void>) => {
      return !!applicationId && !!loadNOA;
    },
  },
  components: { ConfirmModal },
  props: {
    assessmentId: {
      type: Number,
      required: true,
    },
    viewOnly: {
      type: Boolean,
      required: false,
    },
    canReissueMSFAA: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const { dateOnlyLongString } = useFormatters();
    const confirmReissueMSFAA = ref({} as ModalDialog<boolean>);
    const initialData = ref({} as NoticeOfAssessment);

    const getMSFAAStatusClass = (isMSFAACancelled: boolean): string => {
      return isMSFAACancelled ? MSFAA_CANCELED_CLASS : MSFAA_SUCCESS_CLASS;
    };

    const loadNOA = async () => {
      const assessment =
        await StudentAssessmentsService.shared.getAssessmentNOA(
          props.assessmentId,
        );
      const noaDisbursementSchedule =
        assessment.disbursement as NOADisbursementSchedule;
      // Adjust disbursement schedules
      // First disbursement.
      noaDisbursementSchedule.disbursement1MSFAACancelledDateFormatted =
        dateOnlyLongString(
          noaDisbursementSchedule.disbursement1MSFAACancelledDate,
        );
      noaDisbursementSchedule.disbursement1MSFAAStatusClass =
        getMSFAAStatusClass(
          !!noaDisbursementSchedule.disbursement1MSFAACancelledDate,
        );
      // Second disbursement.
      noaDisbursementSchedule.disbursement2MSFAACancelledDateFormatted =
        dateOnlyLongString(
          noaDisbursementSchedule.disbursement2MSFAACancelledDate,
        );
      noaDisbursementSchedule.disbursement2MSFAAStatusClass =
        getMSFAAStatusClass(
          !!noaDisbursementSchedule.disbursement2MSFAACancelledDate,
        );
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
        viewOnly: props.viewOnly,
        canReissueMSFAA,
      };
      emit(
        "assessmentDataLoaded",
        initialData.value.applicationStatus,
        initialData.value.noaApprovalStatus,
      );
    };

    onMounted(loadNOA);

    watch(
      () => props.viewOnly,
      () => {
        initialData.value.viewOnly = props.viewOnly;
      },
    );

    const customEvent = async (_form: FormIOForm, event: FormIOCustomEvent) => {
      if (event.type === FormIOCustomEventTypes.ReissueMSFAA)
        if (await confirmReissueMSFAA.value.showModal()) {
          emit("reissueMSFAA", initialData.value.applicationId, () =>
            loadNOA(),
          );
        }
    };

    return {
      confirmReissueMSFAA,
      customEvent,
      initialData,
    };
  },
});
</script>
