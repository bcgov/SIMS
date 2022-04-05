<template>
  <v-container>
    <v-card>
      <v-container>
        <body-header
          title="Requests"
          class="m-1"
          subTitle="Requests for application changes that may require reassessments"
          :recordsCount="requestedAssessment.length"
        >
        </body-header>
        <content-group class="mt-4">
          <DataTable
            :value="requestedAssessment"
            :paginator="true"
            :rows="DEFAULT_PAGE_LIMIT"
            :rowsPerPageOptions="PAGINATION_LIST"
            :totalRecords="requestedAssessment.length"
          >
            <template #empty>
              <p class="text-center font-weight-bold">No records found.</p>
            </template>
            <Column
              field="submittedDate"
              header="Submitted date"
              sortable="true"
              ><template #body="slotProps">{{
                dateOnlyLongString(slotProps.data.submittedDate)
              }}</template></Column
            ><Column field="triggerType" header="Type" sortable="true"></Column>
            <Column header="Request form" sortable="false"
              ><template #body="slotProps"
                ><v-btn
                  @click="
                    viewRequest(slotProps.data.triggerType, slotProps.data.id)
                  "
                  class="primary"
                  text
                  >View request</v-btn
                ></template
              ></Column
            >
            ><Column field="status" header="Status" sortable="true">
              <template #body="slotProps"
                ><status-chip-requested-assessment
                  :status="slotProps.data.status" /></template
            ></Column>
          </DataTable>
        </content-group>
      </v-container>
    </v-card>
  </v-container>
</template>
<script lang="ts">
import {
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  RequestAssessmentSummaryApiOutDTO,
} from "@/types";
import { ref, onMounted } from "vue";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { useFormatters } from "@/composables";
import StatusChipRequestedAssessment from "@/components/generic/StatusChipRequestedAssessment.vue";
import { AssessmentTriggerType } from "@/types/contracts/AssessmentTrigger";
import { useRouter } from "vue-router";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";

export default {
  components: {
    StatusChipRequestedAssessment,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const { dateOnlyLongString } = useFormatters();
    const router = useRouter();

    const requestedAssessment = ref([] as RequestAssessmentSummaryApiOutDTO[]);
    onMounted(async () => {
      requestedAssessment.value =
        await StudentAssessmentsService.shared.getAssessmentRequest(
          props.applicationId,
        );
    });

    const viewRequest = (triggerType: AssessmentTriggerType, id: number) => {
      switch (triggerType) {
        case AssessmentTriggerType.StudentAppeal:
          router.push({
            name: AESTRoutesConst.STUDENT_REQUEST_CHANGE_APPROVAL,
            params: {
              studentId: props.studentId,
              applicationId: props.applicationId,
              appealId: id,
            },
          });
          break;
        case AssessmentTriggerType.ScholasticStandingChange:
          // TODO: Redirect to ScholasticStandingChange approval.
          break;
      }
    };

    return {
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      requestedAssessment,
      dateOnlyLongString,
      viewRequest,
    };
  },
};
</script>
