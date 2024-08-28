<template>
  <v-card v-if="requestedAssessment.length || showWhenEmpty">
    <v-container>
      <body-header
        title="Unapproved changes"
        class="m-1"
        subTitle="Pending or declined requests submitted by the student or institution."
        :recordsCount="requestedAssessment.length"
      >
      </body-header>
      <content-group class="mt-4">
        <toggle-content
          :toggled="!requestedAssessment.length"
          message="No requests found."
        >
          <DataTable
            :value="requestedAssessment"
            :paginator="true"
            :rows="DEFAULT_PAGE_LIMIT"
            :rowsPerPageOptions="PAGINATION_LIST"
            :totalRecords="requestedAssessment.length"
          >
            <Column
              field="submittedDate"
              header="Submitted date"
              :sortable="true"
              ><template #body="slotProps">{{
                dateOnlyLongString(slotProps.data.submittedDate)
              }}</template></Column
            >
            <Column field="requestType" header="Type" :sortable="true"></Column>
            <Column header="Request form" :sortable="false"
              ><template #body="{ data }"
                ><v-btn
                  @click="viewRequestForm(data)"
                  color="primary"
                  variant="text"
                  class="text-decoration-underline"
                  prepend-icon="fa:far fa-file-alt"
                >
                  View request</v-btn
                ></template
              ></Column
            >
            <Column field="status" header="Status" :sortable="true">
              <template #body="slotProps"
                ><status-chip-requested-assessment
                  :status="slotProps.data.status" /></template
            ></Column>
          </DataTable>
        </toggle-content>
      </content-group>
    </v-container>
  </v-card>
</template>
<script lang="ts">
import { DEFAULT_PAGE_LIMIT, PAGINATION_LIST } from "@/types";
import { ref, onMounted, defineComponent } from "vue";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { useFormatters } from "@/composables";
import StatusChipRequestedAssessment from "@/components/generic/StatusChipRequestedAssessment.vue";
import {
  RequestAssessmentSummaryAPIOutDTO,
  RequestAssessmentTypeAPIOutDTO,
} from "@/services/http/dto/Assessment.dto";

export default defineComponent({
  emits: [
    "viewStudentAppeal",
    "viewStudentApplicationOfferingChange",
    "viewApplicationException",
    "viewOfferingRequest",
  ],
  components: {
    StatusChipRequestedAssessment,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
    showWhenEmpty: {
      type: Boolean,
      required: false,
      default: true,
    },
    studentId: {
      type: Number,
      required: false,
    },
  },
  setup(props, context) {
    const { dateOnlyLongString } = useFormatters();

    const requestedAssessment = ref([] as RequestAssessmentSummaryAPIOutDTO[]);
    onMounted(async () => {
      requestedAssessment.value =
        await StudentAssessmentsService.shared.getAssessmentRequest(
          props.applicationId,
          props.studentId,
        );
    });

    const viewRequestForm = (data: RequestAssessmentSummaryAPIOutDTO) => {
      switch (data.requestType) {
        case RequestAssessmentTypeAPIOutDTO.StudentAppeal:
          context.emit("viewStudentAppeal", data.id);
          break;
        case RequestAssessmentTypeAPIOutDTO.ApplicationOfferingChangeRequest:
          context.emit("viewStudentApplicationOfferingChange", data.id);
          break;
        case RequestAssessmentTypeAPIOutDTO.StudentException:
          context.emit("viewApplicationException", data.id);
          break;
        case RequestAssessmentTypeAPIOutDTO.OfferingRequest:
          context.emit("viewOfferingRequest", data.id, data.programId);
          break;
      }
    };

    return {
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      requestedAssessment,
      dateOnlyLongString,
      viewRequestForm,
    };
  },
});
</script>
