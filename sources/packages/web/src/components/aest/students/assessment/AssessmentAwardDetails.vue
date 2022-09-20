<template>
  <div v-if="assessmentAwardData.estimatedAward">
    <div class="font-weight-bold my-3">First Payment</div>
    <v-row>
      <v-col>
        <content-group>
          <div class="category-header-medium primary-color my-3">
            Estimated award
          </div>
          <!-- Estimated award table. -->
          <v-table class="bordered">
            <thead>
              <tr>
                <th scope="col" class="text-left">Loan/grant type</th>
                <th scope="col" class="text-left">Estimated award</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Canada Student Loan</td>
                <td>
                  {{
                    assessmentAwardData.estimatedAward.disbursement1cslf ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>B.C. Student Loan</td>
                <td>
                  {{
                    assessmentAwardData.estimatedAward.disbursement1bcsl ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  CSG-P
                  <tooltip-icon
                    content="Canada Student Grant with Permanent Disability."
                  />
                </td>
                <td>
                  {{
                    assessmentAwardData.estimatedAward.disbursement1csgp ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  CSG-D
                  <tooltip-icon
                    content="Canada Student Grant with dependant(s)."
                  />
                </td>
                <td>
                  {{
                    assessmentAwardData.estimatedAward.disbursement1csgd ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  CSG-F
                  <tooltip-icon
                    content="Canada Student Grant for Full time studies."
                  />
                </td>
                <td>
                  {{
                    assessmentAwardData.estimatedAward.disbursement1csgf ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  CSG-TU
                  <tooltip-icon content="Canada Student Grant for Top-up." />
                </td>
                <td>
                  {{
                    assessmentAwardData.estimatedAward.disbursement1csgt ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  BCAG <tooltip-icon content="British Colombia Access Grant." />
                </td>
                <td>
                  {{
                    assessmentAwardData.estimatedAward.disbursement1bcag ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  BCAG-D
                  <tooltip-icon
                    content="British Colombia Access Grant with disabilities."
                  />
                </td>
                <td>
                  {{
                    assessmentAwardData.estimatedAward.disbursement1bcag ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  SBSD
                  <tooltip-icon
                    content="British Colombia Supplemental Bursary with Disabilities."
                  />
                </td>
                <td>
                  {{
                    assessmentAwardData.estimatedAward.disbursement1sbsd ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
            </tbody>
          </v-table>
          <div class="my-3">
            <progress-info
              :data="
                mapCOEAssessmentProgressStatus(
                  assessmentAwardData.estimatedAward.disbursement1Status,
                )
              "
            />
          </div>
          <div class="my-3" v-if="isFirstDisbursementCompleted">
            <v-icon
              icon="fa:fas fa-check-circle"
              color="success"
              class="progress-info-icon"
            />
            Tuition remittance applied
            <span class="label-bold"
              >-${{
                assessmentAwardData.estimatedAward
                  .disbursement1TuitionRemittance
              }}</span
            >
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
          <v-table class="bordered" v-if="showFirstFinalAward">
            <thead>
              <tr>
                <th scope="col" class="text-left">Loan/grant type</th>
                <th scope="col" class="text-left">Final award</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Canada Student Loan</td>
                <td>
                  {{
                    assessmentAwardData.finalAward.disbursementReceipt1cslf ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>B.C. Student Loan</td>
                <td>
                  {{
                    assessmentAwardData.finalAward.disbursementReceipt1bcsl ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  CSG-P
                  <tooltip-icon
                    content="Canada Student Grant with Permanent Disability."
                  />
                </td>
                <td>
                  {{
                    assessmentAwardData.finalAward.disbursementReceipt1csgp ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  CSG-D
                  <tooltip-icon
                    content="Canada Student Grant with dependant(s)."
                  />
                </td>
                <td>
                  {{
                    assessmentAwardData.finalAward.disbursementReceipt1csgd ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  CSG-F
                  <tooltip-icon
                    content="Canada Student Grant for Full time studies."
                  />
                </td>
                <td>
                  {{
                    assessmentAwardData.finalAward.disbursementReceipt1csgf ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  CSG-TU
                  <tooltip-icon content="Canada Student Grant for Top-up." />
                </td>
                <td>
                  {{
                    assessmentAwardData.finalAward.disbursementReceipt1csgt ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  BCAG <tooltip-icon content="British Colombia Access Grant." />
                </td>
                <td>
                  {{
                    assessmentAwardData.finalAward.disbursementReceipt1bcag ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  BCAG-D
                  <tooltip-icon
                    content="British Colombia Access Grant with disabilities."
                  />
                </td>
                <td>
                  {{
                    assessmentAwardData.finalAward.disbursementReceipt1bcag ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  SBSD
                  <tooltip-icon
                    content="British Colombia Supplemental Bursary with Disabilities."
                  />
                </td>
                <td>
                  {{
                    assessmentAwardData.finalAward.disbursementReceipt1sbsd ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
            </tbody>
          </v-table>
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
          <v-table class="bordered">
            <thead>
              <tr>
                <th scope="col" class="text-left">Loan/grant type</th>
                <th scope="col" class="text-left">Estimated award</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Canada Student Loan</td>
                <td>
                  {{
                    assessmentAwardData.estimatedAward.disbursement2cslf ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>B.C. Student Loan</td>
                <td>
                  {{
                    assessmentAwardData.estimatedAward.disbursement2bcsl ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  CSG-P
                  <tooltip-icon
                    content="Canada Student Grant with Permanent Disability."
                  />
                </td>
                <td>
                  {{
                    assessmentAwardData.estimatedAward.disbursement2csgp ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  CSG-D
                  <tooltip-icon
                    content="Canada Student Grant with dependant(s)."
                  />
                </td>
                <td>
                  {{
                    assessmentAwardData.estimatedAward.disbursement2csgd ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  CSG-F
                  <tooltip-icon
                    content="Canada Student Grant for Full time studies."
                  />
                </td>
                <td>
                  {{
                    assessmentAwardData.estimatedAward.disbursement2csgf ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  CSG-TU
                  <tooltip-icon content="Canada Student Grant for Top-up." />
                </td>
                <td>
                  {{
                    assessmentAwardData.estimatedAward.disbursement2csgt ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  BCAG <tooltip-icon content="British Colombia Access Grant." />
                </td>
                <td>
                  {{
                    assessmentAwardData.estimatedAward.disbursement2bcag ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  BCAG-D
                  <tooltip-icon
                    content="British Colombia Access Grant with disabilities."
                  />
                </td>
                <td>
                  {{
                    assessmentAwardData.estimatedAward.disbursement2bcag ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  SBSD
                  <tooltip-icon
                    content="British Colombia Supplemental Bursary with Disabilities."
                  />
                </td>
                <td>
                  {{
                    assessmentAwardData.estimatedAward.disbursement2sbsd ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
            </tbody>
          </v-table>
          <div class="my-3">
            <progress-info
              :data="
                mapCOEAssessmentProgressStatus(
                  assessmentAwardData.estimatedAward.disbursement2Status,
                )
              "
            />
          </div>
          <div class="my-3" v-if="isSecondDisbursementCompleted">
            <v-icon
              icon="fa:fas fa-check-circle"
              color="success"
              class="progress-info-icon"
            />
            Tuition remittance applied
            <span class="label-bold"
              >-${{
                assessmentAwardData.estimatedAward
                  .disbursement2TuitionRemittance
              }}</span
            >
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
          <v-table class="bordered" v-if="showSecondFinalAward">
            <thead>
              <tr>
                <th scope="col" class="text-left">Loan/grant type</th>
                <th scope="col" class="text-left">Final award</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Canada Student Loan</td>
                <td>
                  {{
                    assessmentAwardData.finalAward.disbursementReceipt2cslf ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>B.C. Student Loan</td>
                <td>
                  {{
                    assessmentAwardData.finalAward.disbursementReceipt2bcsl ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  CSG-P
                  <tooltip-icon
                    content="Canada Student Grant with Permanent Disability."
                  />
                </td>
                <td>
                  {{
                    assessmentAwardData.finalAward.disbursementReceipt2csgp ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  CSG-D
                  <tooltip-icon
                    content="Canada Student Grant with dependant(s)."
                  />
                </td>
                <td>
                  {{
                    assessmentAwardData.finalAward.disbursementReceipt2csgd ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  CSG-F
                  <tooltip-icon
                    content="Canada Student Grant for Full time studies."
                  />
                </td>
                <td>
                  {{
                    assessmentAwardData.finalAward.disbursementReceipt2csgf ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  CSG-TU
                  <tooltip-icon content="Canada Student Grant for Top-up." />
                </td>
                <td>
                  {{
                    assessmentAwardData.finalAward.disbursementReceipt2csgt ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  BCAG <tooltip-icon content="British Colombia Access Grant." />
                </td>
                <td>
                  {{
                    assessmentAwardData.finalAward.disbursementReceipt2bcag ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  BCAG-D
                  <tooltip-icon
                    content="British Colombia Access Grant with disabilities."
                  />
                </td>
                <td>
                  {{
                    assessmentAwardData.finalAward.disbursementReceipt2bcag ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
              <tr>
                <td>
                  SBSD
                  <tooltip-icon
                    content="British Colombia Supplemental Bursary with Disabilities."
                  />
                </td>
                <td>
                  {{
                    assessmentAwardData.finalAward.disbursementReceipt2sbsd ??
                    "(Not eligible)"
                  }}
                </td>
              </tr>
            </tbody>
          </v-table>
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
import { COEStatus, ProgressInfoDetails, ProgressInfoStatus } from "@/types";
import { useRouter } from "vue-router";
import { PropType, computed } from "vue";
import ProgressInfo from "@/components/generic/ProgressInfo.vue";

export default {
  components: { ProgressInfo },
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
    ): ProgressInfoDetails => {
      switch (status) {
        case COEStatus.completed:
          return {
            status: ProgressInfoStatus.Completed,
            header: "Enrolment confirmed",
          };
        case COEStatus.required:
          return {
            status: ProgressInfoStatus.Pending,
            header: "Enrolment not confirmed",
          };
        case COEStatus.declined:
          return {
            status: ProgressInfoStatus.Rejected,
            header: "Enrolment declined",
          };
        default:
          return { status: ProgressInfoStatus.Pending, header: "" };
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
    };
  },
};
</script>
