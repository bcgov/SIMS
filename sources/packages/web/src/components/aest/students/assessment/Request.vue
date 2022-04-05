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
                  color="primary"
                  variant="text"
                  class="text-decoration-underline"
                >
                  <font-awesome-icon :icon="['fas', 'file-alt']" class="mr-2" />
                  View request</v-btn
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
import { ref, onMounted, SetupContext } from "vue";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { useFormatters } from "@/composables";
import StatusChipRequestedAssessment from "@/components/generic/StatusChipRequestedAssessment.vue";
import { AssessmentTriggerType } from "@/types/contracts/AssessmentTrigger";

export default {
  emits: ["viewStudentAppeal", "viewScholasticStandingChange"],
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
  setup(props: any, context: SetupContext) {
    const { dateOnlyLongString } = useFormatters();

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
          context.emit("viewStudentAppeal", id);
          break;
        case AssessmentTriggerType.ScholasticStandingChange:
          context.emit("viewScholasticStandingChange", id);
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
