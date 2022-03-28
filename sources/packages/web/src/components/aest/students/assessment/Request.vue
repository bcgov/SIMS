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
            ><Column field="triggerType" header="Type" sortable="true"></Column
            ><Column header="Request form"></Column
            ><Column field="status" header="Status" sortable="true">
              <template #body="slotProps"
                ><status-chip-requested-assessment
                  :status="slotProps.data.status"/></template
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
  RequestAssessmentSummaryDTO,
} from "@/types";
import { ref, onMounted } from "vue";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { useFormatters } from "@/composables";
import StatusChipRequestedAssessment from "@/components/generic/StatusChipRequestedAssessment.vue";

export default {
  components: {
    StatusChipRequestedAssessment,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const { dateOnlyLongString } = useFormatters();

    const requestedAssessment = ref([] as RequestAssessmentSummaryDTO[]);
    onMounted(async () => {
      requestedAssessment.value = await StudentAssessmentsService.shared.getAssessmentRequest(
        props.applicationId,
      );
    });
    return {
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      requestedAssessment,
      dateOnlyLongString,
    };
  },
};
</script>
