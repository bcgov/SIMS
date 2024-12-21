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
import { defineComponent, ref, onMounted } from "vue";
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
  FullTimeAssessment,
  PartTimeAssessment,
} from "@/types";

interface NoticeOfAssessment extends AssessmentNOAAPIOutDTO {
  canReissueMSFAA: boolean;
  assessedCosts: any;
  assessedContributions: any;
  awardBreakdown: any;
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

    const getAwardValue = (disbursement: undefined | number): string => {
      if (!disbursement) return "(Not eligible)";
      return `$${disbursement.toLocaleString("en-CA", {
        minimumFractionDigits: 2,
      })}`;
    };

    const getDisbursementTotal = (
      disbursement1: undefined | number,
      disbursement2: undefined | number,
    ): string => {
      const parsedDisbursement1 = disbursement1 || 0;
      const parsedDisbursement2 = disbursement2 || 0;
      return `$${(parsedDisbursement1 + parsedDisbursement2).toLocaleString(
        "en-CA",
        {
          minimumFractionDigits: 2,
        },
      )}`;
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

      const fullTimeAssessment = assessment.assessment as FullTimeAssessment;
      const partTimeAssessment = assessment.assessment as PartTimeAssessment;
      const assessedCosts = {
        tuitionCost: getAwardValue(fullTimeAssessment.tuitionCost),
        booksAndSuppliesCost: getAwardValue(
          fullTimeAssessment.booksAndSuppliesCost,
        ),
        exceptionalEducationCost: getAwardValue(
          fullTimeAssessment.exceptionalEducationCost,
        ),
        livingAllowance: getAwardValue(fullTimeAssessment.livingAllowance),
        transportationCost: getAwardValue(
          fullTimeAssessment.transportationCost,
        ),
        childcareCost: getAwardValue(fullTimeAssessment.childcareCost),
        otherAllowableCost: getAwardValue(
          fullTimeAssessment.otherAllowableCost,
        ),
        totalAssessedCost: getAwardValue(fullTimeAssessment.totalAssessedCost),
        mandatoryFees: getAwardValue(partTimeAssessment.mandatoryFees),
        miscellaneousAllowance: getAwardValue(
          partTimeAssessment.miscellaneousCost,
        ),
        totalAssessmentNeed: getAwardValue(
          partTimeAssessment.totalAssessmentNeed,
        ),
      };
      const assessedContributions = {
        studentTotalFederalContribution: getAwardValue(
          fullTimeAssessment.studentTotalFederalContribution,
        ),
        studentTotalProvincialContribution: getAwardValue(
          fullTimeAssessment.studentTotalProvincialContribution,
        ),
        partnerAssessedContribution: getAwardValue(
          fullTimeAssessment.partnerAssessedContribution,
        ),
        parentAssessedContribution: getAwardValue(
          fullTimeAssessment.parentAssessedContribution,
        ),
        totalFederalContribution: getAwardValue(
          fullTimeAssessment.totalFederalContribution,
        ),
        totalProvincialContribution: getAwardValue(
          fullTimeAssessment.totalProvincialContribution,
        ),
        federalAssessmentNeed: getAwardValue(
          fullTimeAssessment.federalAssessmentNeed,
        ),
        provincialAssessmentNeed: getAwardValue(
          fullTimeAssessment.provincialAssessmentNeed,
        ),
      };
      const awardBreakdown = {
        fullTime: {
          disbursement1cslf: getAwardValue(
            assessment.disbursement?.disbursement1cslf,
          ),
          disbursement1bcsl: getAwardValue(
            assessment.disbursement?.disbursement1bcsl,
          ),
          disbursement1csgp: getAwardValue(
            assessment.disbursement?.disbursement1csgp,
          ),
          disbursement1csgd: getAwardValue(
            assessment.disbursement?.disbursement1csgd,
          ),
          disbursement1csgf: getAwardValue(
            assessment.disbursement?.disbursement1csgf,
          ),
          disbursement1csgt: getAwardValue(
            assessment.disbursement?.disbursement1csgt,
          ),
          disbursement1bcag: getAwardValue(
            assessment.disbursement?.disbursement1bcag,
          ),
          disbursement1sbsd: getAwardValue(
            assessment.disbursement?.disbursement1sbsd,
          ),
          disbursement1bgpd: getAwardValue(
            assessment.disbursement?.disbursement1bgpd,
          ),
          disbursement1bcsg: getAwardValue(
            assessment.disbursement?.disbursement1bcsg,
          ),
          disbursement2cslf: getAwardValue(
            assessment.disbursement?.disbursement2cslf,
          ),
          disbursement2bcsl: getAwardValue(
            assessment.disbursement?.disbursement2bcsl,
          ),
          disbursement2csgp: getAwardValue(
            assessment.disbursement?.disbursement2csgp,
          ),
          disbursement2csgd: getAwardValue(
            assessment.disbursement?.disbursement2csgd,
          ),
          disbursement2csgf: getAwardValue(
            assessment.disbursement?.disbursement2csgf,
          ),
          disbursement2csgt: getAwardValue(
            assessment.disbursement?.disbursement2csgt,
          ),
          disbursement2bcag: getAwardValue(
            assessment.disbursement?.disbursement2bcag,
          ),
          disbursement2sbsd: getAwardValue(
            assessment.disbursement?.disbursement2sbsd,
          ),
          disbursement2bgpd: getAwardValue(
            assessment.disbursement?.disbursement2bgpd,
          ),
          disbursement2bcsg: getAwardValue(
            assessment.disbursement?.disbursement2bcsg,
          ),
          totalcslf: getDisbursementTotal(
            assessment.disbursement?.disbursement1cslf,
            assessment.disbursement?.disbursement2cslf,
          ),
          totalbcsl: getDisbursementTotal(
            assessment.disbursement?.disbursement1bcsl,
            assessment.disbursement?.disbursement2bcsl,
          ),
          totalcsgp: getDisbursementTotal(
            assessment.disbursement?.disbursement1csgp,
            assessment.disbursement?.disbursement2csgp,
          ),
          totalcsgd: getDisbursementTotal(
            assessment.disbursement?.disbursement1csgd,
            assessment.disbursement?.disbursement2csgd,
          ),
          totalcsgf: getDisbursementTotal(
            assessment.disbursement?.disbursement1csgf,
            assessment.disbursement?.disbursement2csgf,
          ),
          totalcsgt: getDisbursementTotal(
            assessment.disbursement?.disbursement1csgt,
            assessment.disbursement?.disbursement2csgt,
          ),
          totalbcag: getDisbursementTotal(
            assessment.disbursement?.disbursement1bcag,
            assessment.disbursement?.disbursement2bcag,
          ),
          totalsbsd: getDisbursementTotal(
            assessment.disbursement?.disbursement1sbsd,
            assessment.disbursement?.disbursement2sbsd,
          ),
          totalbgpd: getDisbursementTotal(
            assessment.disbursement?.disbursement1bgpd,
            assessment.disbursement?.disbursement2bgpd,
          ),
          totalbcsg: getDisbursementTotal(
            assessment.disbursement?.disbursement1bcsg,
            assessment.disbursement?.disbursement2bcsg,
          ),
        },
        partTime: {
          disbursement1cslp: getAwardValue(
            assessment.disbursement?.disbursement1cslp,
          ),
          disbursement1csgp: getAwardValue(
            assessment.disbursement?.disbursement1csgp,
          ),
          disbursement1cspt: getAwardValue(
            assessment.disbursement?.disbursement1cspt,
          ),
          disbursement1csgd: getAwardValue(
            assessment.disbursement?.disbursement1csgd,
          ),
          disbursement1bcag: getAwardValue(
            assessment.disbursement?.disbursement1bcag,
          ),
          disbursement1sbsd: getAwardValue(
            assessment.disbursement?.disbursement1sbsd,
          ),
          disbursement2cslp: getAwardValue(
            assessment.disbursement?.disbursement2cslp,
          ),
          disbursement2csgp: getAwardValue(
            assessment.disbursement?.disbursement2csgp,
          ),
          disbursement2cspt: getAwardValue(
            assessment.disbursement?.disbursement2cspt,
          ),
          disbursement2csgd: getAwardValue(
            assessment.disbursement?.disbursement2csgd,
          ),
          disbursement2bcag: getAwardValue(
            assessment.disbursement?.disbursement2bcag,
          ),
          disbursement2sbsd: getAwardValue(
            assessment.disbursement?.disbursement2sbsd,
          ),
          totalcslp: getDisbursementTotal(
            assessment.disbursement?.disbursement1cslp,
            assessment.disbursement?.disbursement2cslp,
          ),
          totalcsgp: getDisbursementTotal(
            assessment.disbursement?.disbursement1csgp,
            assessment.disbursement?.disbursement2csgp,
          ),
          totalcspt: getDisbursementTotal(
            assessment.disbursement?.disbursement1cspt,
            assessment.disbursement?.disbursement2cspt,
          ),
          totalcsgd: getDisbursementTotal(
            assessment.disbursement?.disbursement1csgd,
            assessment.disbursement?.disbursement2csgd,
          ),
          totalbcag: getDisbursementTotal(
            assessment.disbursement?.disbursement1bcag,
            assessment.disbursement?.disbursement2bcag,
          ),
          totalsbsd: getDisbursementTotal(
            assessment.disbursement?.disbursement1sbsd,
            assessment.disbursement?.disbursement2sbsd,
          ),
        },
      };

      initialData.value = {
        ...assessment,
        canReissueMSFAA,
        assessedCosts,
        assessedContributions,
        awardBreakdown,
      };

      emit(
        "assessmentDataLoaded",
        initialData.value.applicationStatus,
        initialData.value.noaApprovalStatus,
        initialData.value.applicationCurrentAssessmentId,
      );
    };

    onMounted(loadNOA);

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
