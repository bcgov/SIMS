<template>
  <v-container>
    <v-card>
      <v-container>
        <p class="category-header-large color-blue">
          History
        </p>
        <span>A history of assessments</span>
        <content-group class="mt-4">
          <DataTable
            :value="assessmentHistory"
            :paginator="true"
            :rows="DEFAULT_PAGE_LIMIT"
            :rowsPerPageOptions="PAGINATION_LIST"
            :totalRecords="assessmentHistory.length"
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
            ><Column field="status" header="Status" sortable="true"
              ><template #body="slotProps"
                ><status-chip-assessment-history
                  :status="slotProps.data.status"/></template></Column
            ><Column
              field="assessmentDate"
              header="Assessment date"
              sortable="true"
              ><template #body="slotProps">
                <span v-if="slotProps.data.assessmentDate">{{
                  dateOnlyLongString(slotProps.data.assessmentDate)
                }}</span
                ><span v-else>-</span></template
              ></Column
            ><Column header="Assessment"></Column>
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
  AssessmentHistorySummaryDTO,
} from "@/types";
import { ref, onMounted } from "vue";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { useFormatters } from "@/composables";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import StatusChipAssessmentHistory from "@/components/generic/StatusChipAssessmentHistory.vue";

export default {
  components: {
    ContentGroup,
    StatusChipAssessmentHistory,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const { dateOnlyLongString } = useFormatters();
    const assessmentHistory = ref([] as AssessmentHistorySummaryDTO[]);
    onMounted(async () => {
      assessmentHistory.value = await StudentAssessmentsService.shared.getAssessmentHistory(
        props.applicationId,
      );
    });
    return {
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      assessmentHistory,
      dateOnlyLongString,
    };
  },
};
</script>
