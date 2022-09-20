<template>
  <div v-if="assessmentAwardData.estimatedAward">
    <!-- Show the first payment/second payment header only if there is second disbursement. -->
    <div v-if="isSecondDisbursementAvailable" class="font-weight-bold my-3">
      First Payment
    </div>
    <v-row>
      <v-col>
        <content-group>
          <div class="category-header-medium primary-color my-3">
            Estimated award
          </div>
          <!-- Estimated award table. -->
          <award-table
            :awardDetails="assessmentAwardData.estimatedAward"
            identifier="disbursement1"
          />
          <div class="my-3">
            <status-info-label
              :data="
                mapCOEAssessmentProgressStatus(
                  assessmentAwardData.estimatedAward.disbursement1Status,
                )
              "
            />
          </div>
          <div
            class="my-3"
            v-if="
              assessmentAwardData.estimatedAward.disbursement1TuitionRemittance
            "
          >
            <status-info-label :data="{ status: StatusInfo.Completed }"
              >Tuition remittance applied
              <span class="label-bold"
                >-${{
                  assessmentAwardData.estimatedAward
                    .disbursement1TuitionRemittance
                }}</span
              >
              <tooltip-icon
                >Tuition remittance is when your institution requests money from
                your award to pay for upcoming school fees.</tooltip-icon
              >
            </status-info-label>
          </div>
          <content-group-info>
            <div>
              <span class="label-bold">Earliest date of disbursement: </span>
              <span>{{
                assessmentAwardData.estimatedAward.disbursement1Date
              }}</span>
            </div>
            <div v-if="isFirstDisbursementCompleted">
              <span class="label-bold">Certificate number: </span>
              <span>{{
                assessmentAwardData.estimatedAward.disbursement1DocumentNumber
              }}</span>
            </div>
          </content-group-info>
        </content-group>
      </v-col>
      <v-col>
        <content-group>
          <div class="category-header-medium primary-color my-3">
            Final award
          </div>
          <!-- Final award table. -->
          <award-table
            :awardDetails="assessmentAwardData.finalAward"
            identifier="disbursementReceipt1"
            v-if="showFirstFinalAward"
          />
          <div v-else>
            {{
              getFinalAwardNotAvailableMessage(
                assessmentAwardData.estimatedAward.disbursement1Status,
              )
            }}
          </div>
        </content-group>
      </v-col>
    </v-row>
  </div>
  <!-- Estimated and actual award details of second disbursement. -->
  <div v-if="isSecondDisbursementAvailable">
    <div class="font-weight-bold my-3">Second Payment</div>
    <v-row>
      <v-col>
        <content-group>
          <div class="category-header-medium primary-color my-3">
            Estimated award
          </div>
          <!-- Estimated award table. -->
          <award-table
            :awardDetails="assessmentAwardData.estimatedAward"
            identifier="disbursement2"
          />
          <div class="my-3">
            <status-info-label
              :data="
                mapCOEAssessmentProgressStatus(
                  assessmentAwardData.estimatedAward.disbursement2Status,
                )
              "
            />
          </div>
          <div
            class="my-3"
            v-if="
              assessmentAwardData.estimatedAward.disbursement2TuitionRemittance
            "
          >
            <status-info-label :data="{ status: StatusInfo.Completed }">
              Tuition remittance applied
              <span class="label-bold"
                >-${{
                  assessmentAwardData.estimatedAward
                    .disbursement2TuitionRemittance
                }}</span
              >
              <tooltip-icon
                >Tuition remittance is when your institution requests money from
                your award to pay for upcoming school fees.</tooltip-icon
              >
            </status-info-label>
          </div>
          <content-group-info>
            <div>
              <span class="label-bold">Earliest date of disbursement: </span>
              <span>{{
                assessmentAwardData.estimatedAward.disbursement2Date
              }}</span>
            </div>
            <div v-if="isSecondDisbursementCompleted">
              <span class="label-bold">Certificate number: </span>
              <span>{{
                assessmentAwardData.estimatedAward.disbursement2DocumentNumber
              }}</span>
            </div>
          </content-group-info>
        </content-group>
      </v-col>
      <v-col>
        <content-group>
          <div class="category-header-medium primary-color my-3">
            Final award
          </div>
          <!-- Final award table. -->
          <award-table
            :awardDetails="assessmentAwardData.finalAward"
            identifier="disbursementReceipt2"
            v-if="showSecondFinalAward"
          />
          <div v-else>
            {{
              getFinalAwardNotAvailableMessage(
                assessmentAwardData.estimatedAward.disbursement2Status,
              )
            }}
          </div>
        </content-group>
      </v-col>
    </v-row>
  </div>
</template>
<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { AwardDetailsAPIOutDTO } from "@/services/http/dto";
import { COEStatus, StatusInfoDetails, StatusInfo } from "@/types";
import { useRouter } from "vue-router";
import { PropType, computed } from "vue";
import StatusInfoLabel from "@/components/generic/StatusInfoLabel.vue";
import AwardTable from "@/components/aest/students/assessment/AwardTable.vue";

export default {
  components: { StatusInfoLabel, AwardTable },
  props: {
    assessmentAwardData: {
      type: Object as PropType<AwardDetailsAPIOutDTO>,
      required: true,
      default: {} as AwardDetailsAPIOutDTO,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const isFirstDisbursementCompleted = computed<boolean>(
      () =>
        props.assessmentAwardData.estimatedAward?.disbursement1Status ===
        COEStatus.completed,
    );
    const isSecondDisbursementAvailable = computed(
      () => props.assessmentAwardData.estimatedAward?.disbursement2Date,
    );
    const isSecondDisbursementCompleted = computed<boolean>(
      () =>
        props.assessmentAwardData.estimatedAward?.disbursement2Status ===
        COEStatus.completed,
    );
    const showFirstFinalAward = computed<boolean>(
      () =>
        isFirstDisbursementCompleted.value &&
        props.assessmentAwardData.finalAward.disbursementReceipt1Id,
    );

    const showSecondFinalAward = computed<boolean>(
      () =>
        isSecondDisbursementCompleted.value &&
        props.assessmentAwardData.finalAward.disbursementReceipt2Id,
    );

    const getFinalAwardNotAvailableMessage = (coeStatus: COEStatus) => {
      if (coeStatus === COEStatus.completed) {
        return "The final award will be shown once confirmed by NSLSC.";
      }
      if (coeStatus === COEStatus.required) {
        return "The final award can't be calculated at this time.";
      }
      return "The final award is no longer applicable due to a change. Any scheduled disbursements will be cancelled.";
    };

    const goToNoticeOfAssessment = () => {
      return router.push({
        name: AESTRoutesConst.NOTICE_OF_ASSESSMENT_VIEW,
        params: {
          studentId: props.studentId,
          applicationId: props.applicationId,
          assessmentId: props.assessmentId,
        },
      });
    };

    const mapCOEAssessmentProgressStatus = (
      status: COEStatus,
    ): StatusInfoDetails => {
      switch (status) {
        case COEStatus.completed:
          return {
            status: StatusInfo.Completed,
            header: "Enrolment confirmed",
          };
        case COEStatus.required:
          return {
            status: StatusInfo.Pending,
            header: "Enrolment not confirmed",
          };
        case COEStatus.declined:
          return {
            status: StatusInfo.Rejected,
            header: "Enrolment declined",
          };
        default:
          return { status: StatusInfo.Pending, header: "" };
      }
    };

    return {
      AESTRoutesConst,
      goToNoticeOfAssessment,
      isSecondDisbursementAvailable,
      isSecondDisbursementCompleted,
      isFirstDisbursementCompleted,
      showFirstFinalAward,
      showSecondFinalAward,
      getFinalAwardNotAvailableMessage,
      mapCOEAssessmentProgressStatus,
      StatusInfo,
    };
  },
};
</script>
