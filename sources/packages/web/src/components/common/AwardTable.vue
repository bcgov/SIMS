<template>
  <body-header :title="header">
    <template #status-chip>
      <status-chip-disbursement :status="getAwardStatus" />
    </template>
  </body-header>
  <v-row>
    <v-col cols="12">
      <v-table class="bordered">
        <thead>
          <tr>
            <th scope="col" class="text-left font-weight-bold">
              Loan/grant type
            </th>
            <th scope="col" class="text-left font-weight-bold">
              Estimated award
            </th>
            <th
              v-if="showFinalAward"
              scope="col"
              class="text-left font-weight-bold"
            >
              Final award
            </th>
            <th scope="col" class="text-left font-weight-bold">Adjustments</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="award in awards" :key="award.awardType">
            <td>
              <span v-if="$vuetify.display.smAndDown">
                {{ award.awardTypeDisplay }}
                <tooltip-icon>{{ award.description }}</tooltip-icon>
              </span>
              <span v-else>
                {{ award.description }}
              </span>
            </td>
            <td>
              {{ getAwardValue(award.awardType) }}
            </td>
            <td v-if="showFinalAward">
              {{ getFinalAwardValue(award.awardType) }}
            </td>
            <td>
              <assessment-award-adjustments
                :adjustments="getAdjustments(award.awardType)"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-col>
  </v-row>
  <div class="my-3">
    <status-info-enrolment
      :coe-status="
        assessmentAwardData.estimatedAward[
          `${identifier}COEStatus`
        ] as COEStatus
      "
      :enrolment-date="
        assessmentAwardData.estimatedAward[`${identifier}EnrolmentDate`] as Date
      "
    />
    <confirm-enrolment
      v-if="allowConfirmEnrolment"
      :coe-status="
        assessmentAwardData.estimatedAward[
          `${identifier}COEStatus`
        ] as COEStatus
      "
      :application-status="assessmentAwardData.applicationStatus"
      :disbursement-id="
        assessmentAwardData.estimatedAward[`${identifier}Id`] as number
      "
      @confirm-enrolment="$emit('confirmEnrolment', $event)"
    />
  </div>
  <div
    class="my-3"
    v-if="assessmentAwardData.estimatedAward[`${identifier}TuitionRemittance`]"
  >
    <status-info-label :status="StatusInfo.Completed"
      >Tuition remittance applied
      <span class="label-bold"
        >-${{
          assessmentAwardData.estimatedAward[`${identifier}TuitionRemittance`]
        }}</span
      >
      <tooltip-icon
        >Tuition remittance is when your institution requests money from your
        award to pay for upcoming school fees.</tooltip-icon
      >
    </status-info-label>
  </div>

  <content-group-info>
    <div>
      <span class="label-bold">Earliest date of disbursement: </span>
      <span>{{
        dateOnlyLongString(
          assessmentAwardData.estimatedAward[`${identifier}Date`] as Date,
        )
      }}</span>
    </div>
    <div
      v-if="
        isDisbursementCompleted &&
        assessmentAwardData.estimatedAward[`${identifier}DocumentNumber`]
      "
    >
      <span class="label-bold">Cert number: </span>
      <span>{{
        assessmentAwardData.estimatedAward[`${identifier}DocumentNumber`]
      }}</span>
    </div>
    <div
      v-if="
        allowFinalAwardExtendedInformation &&
        !!assessmentAwardData.estimatedAward[`${identifier}DateSent`]
      "
    >
      <span class="label-bold">Date sent: </span>
      <span>{{
        dateOnlyLongString(
          assessmentAwardData.estimatedAward[`${identifier}DateSent`] as Date,
        )
      }}</span>
    </div>
  </content-group-info>
  <div class="my-3">
    <status-info-disbursement-cancellation
      v-if="
        assessmentAwardData.estimatedAward[`${identifier}Status`] ===
        DisbursementScheduleStatus.Rejected
      "
      :cancellation-date="
        assessmentAwardData.estimatedAward[
          `${identifier}StatusUpdatedOn`
        ] as Date
      "
    />
    <cancel-disbursement-schedule
      v-if="canCancelDisbursement"
      :disbursement-id="
        assessmentAwardData.estimatedAward[`${identifier}Id`] as number
      "
      @disbursement-cancelled="$emit('disbursementCancelled')"
    />
  </div>

  <div></div>
</template>
<script lang="ts">
import { PropType, defineComponent, computed } from "vue";
import {
  AwardAdjustmentType,
  COEStatus,
  DisbursementScheduleStatus,
  StatusInfo,
} from "@/types";
import { AWARDS, AwardDetail } from "@/constants/award-constants";
import { AwardDetailsAPIOutDTO } from "@/services/http/dto";
import { useFormatters } from "@/composables";
import AssessmentAwardAdjustments from "@/components/common/students/applicationDetails/AssessmentAwardAdjustments.vue";
import StatusChipDisbursement from "@/components/generic/StatusChipDisbursement.vue";
import StatusInfoEnrolment from "@/components/common/StatusInfoEnrolment.vue";
import StatusInfoDisbursementCancellation from "@/components/common/StatusInfoDisbursementCancellation.vue";
import ConfirmEnrolment from "@/components/common/ConfirmEnrolment.vue";
import CancelDisbursementSchedule from "@/components/common/CancelDisbursementSchedule.vue";
/**
 * Suffixes for dynamic fields to track subtracted amounts.
 */
const DISBURSED_SUBTRACTED_SUFFIX = "DisbursedAmountSubtracted";
const OVERAWARD_SUBTRACTED_SUFFIX = "OverawardAmountSubtracted";
const RESTRICTION_SUBTRACTED_SUFFIX = "RestrictionAmountSubtracted";

export default defineComponent({
  emits: {
    confirmEnrolment: (disbursementId: number) => {
      return !!disbursementId;
    },
    disbursementCancelled: null,
  },
  components: {
    AssessmentAwardAdjustments,
    CancelDisbursementSchedule,
    ConfirmEnrolment,
    StatusChipDisbursement,
    StatusInfoEnrolment,
    StatusInfoDisbursementCancellation,
  },
  props: {
    assessmentAwardData: {
      type: Object as PropType<AwardDetailsAPIOutDTO>,
      required: true,
      default: {} as AwardDetailsAPIOutDTO,
    },
    identifier: {
      type: String,
      required: true,
    },
    finalIdentifier: {
      type: String,
      required: true,
    },
    header: {
      type: String,
      required: true,
    },
    allowConfirmEnrolment: {
      type: Boolean,
      required: false,
    },
    allowFinalAwardExtendedInformation: {
      type: Boolean,
      required: false,
      default: false,
    },
    allowDisbursementCancellation: {
      type: Boolean,
      required: false,
      default: false,
    },
  },

  setup(props) {
    const awards = computed<AwardDetail[]>(() =>
      AWARDS.filter(
        (award) =>
          award.offeringIntensity ===
          props.assessmentAwardData.offeringIntensity,
      ),
    );

    const { currencyFormatter, dateOnlyLongString } = useFormatters();

    const getAwardValue = (awardType: string): string | number | Date => {
      const awardValue = props.assessmentAwardData.estimatedAward[
        `${props.identifier}${awardType.toLowerCase()}`
      ] as number;
      // If the award is defined but no values are present it means that a receipt value is missing.
      if (awardValue === null) {
        return "-";
      }
      // If the award in not defined at all it means that the award is not eligible and it was not
      // part of the disbursement calculations output.
      return currencyFormatter(awardValue, "(Not eligible)");
    };

    const getFinalAwardValue = (awardType: string): string | number | Date => {
      if (!props.assessmentAwardData.finalAward) {
        return "";
      }
      const awardValue = props.assessmentAwardData.finalAward[
        `${props.finalIdentifier}${awardType.toLowerCase()}`
      ] as number;
      // If the award is defined but no values are present it means that a receipt value is missing.
      if (awardValue === null) {
        return "-";
      }
      // If the award in not defined at all it means that the award is not eligible and it was not
      // part of the disbursement calculations output.
      return currencyFormatter(awardValue, "(Not eligible)");
    };

    const getAwardStatus = computed<DisbursementScheduleStatus>(() => {
      const status = props.assessmentAwardData.estimatedAward[
        `${props.identifier}Status`
      ] as DisbursementScheduleStatus;
      return status;
    });

    const getAdjustments = (awardType: string): AwardAdjustmentType => {
      // TODO Handle estimated awards.
      if (!props.assessmentAwardData.finalAward) {
        return {
          disbursed: false,
          positiveOveraward: false,
          negativeOveraward: false,
          restriction: false,
        };
      }
      const disbursementValueKey = `${props.finalIdentifier}${awardType.toLowerCase()}`;
      const disbursedAmountSubtracted =
        (props.assessmentAwardData.finalAward[
          `${disbursementValueKey}${DISBURSED_SUBTRACTED_SUFFIX}`
        ] as number) ?? 0;
      const overawardAmountSubtracted =
        (props.assessmentAwardData.finalAward[
          `${disbursementValueKey}${OVERAWARD_SUBTRACTED_SUFFIX}`
        ] as number) ?? 0;
      const restrictionAmountSubtracted =
        (props.assessmentAwardData.finalAward[
          `${disbursementValueKey}${RESTRICTION_SUBTRACTED_SUFFIX}`
        ] as number) ?? 0;
      return {
        disbursed: disbursedAmountSubtracted > 0,
        positiveOveraward: overawardAmountSubtracted > 0,
        negativeOveraward: overawardAmountSubtracted < 0,
        restriction: restrictionAmountSubtracted > 0,
      };
    };

    const showFinalAward = computed(() => {
      //  Rejected disbursements should not show Final Award
      if (getAwardStatus.value === DisbursementScheduleStatus.Rejected) {
        return false;
      }
      return props.assessmentAwardData.finalAward;
    });

    const isDisbursementCompleted = computed<boolean>(
      () =>
        props.assessmentAwardData.estimatedAward[
          `${props.identifier}COEStatus`
        ] === COEStatus.completed,
    );

    const canCancelDisbursement = computed<boolean>(() => {
      return (
        props.allowDisbursementCancellation &&
        props.assessmentAwardData.estimatedAward[
          `${props.identifier}Status`
        ] === DisbursementScheduleStatus.Sent &&
        !props.assessmentAwardData.finalAward?.[
          `${props.finalIdentifier}Received`
        ]
      );
    });

    return {
      getAwardValue,
      getFinalAwardValue,
      awards,
      getAdjustments,
      getAwardStatus,
      showFinalAward,
      DisbursementScheduleStatus,
      isDisbursementCompleted,
      dateOnlyLongString,
      StatusInfo,
      canCancelDisbursement,
    };
  },
});
</script>
