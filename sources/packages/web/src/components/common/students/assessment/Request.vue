<template>
  <v-card v-if="requestedAssessments.length || showWhenEmpty">
    <v-container>
      <body-header
        title="Unapproved changes"
        class="m-1"
        sub-title="Pending or declined requests submitted by the student or institution."
        :records-count="requestedAssessments.length"
      >
      </body-header>
      <content-group class="mt-4">
        <toggle-content
          :toggled="!requestedAssessments.length"
          message="No requests found."
        >
          <v-data-table
            :headers="UnapprovedChangesHeaders"
            :items="requestedAssessments"
            :items-per-page="DEFAULT_PAGE_LIMIT"
            :items-per-page-options="ITEMS_PER_PAGE"
            :mobile="isMobile"
          >
            <template #[`item.submittedDate`]="{ item }">
              {{ dateOnlyLongString(item.submittedDate) }}
            </template>
            <template #[`item.requestType`]="{ item }">
              {{ item.requestType }}
            </template>
            <template #[`item.requestForm`]="{ item }">
              <v-btn
                @click="viewRequestForm(item)"
                color="primary"
                variant="text"
                class="text-decoration-underline"
                prepend-icon="fa:far fa-file-alt"
              >
                View request</v-btn
              >
            </template>
            <template #[`item.status`]="{ item }">
              <status-chip-requested-assessment :status="item.status" />
            </template>
          </v-data-table>
        </toggle-content>
      </content-group>
    </v-container>
  </v-card>
</template>
<script lang="ts">
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  UnapprovedChangesHeaders,
} from "@/types";
import { ref, defineComponent, watchEffect } from "vue";
import { useDisplay } from "vuetify";
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
      default: undefined,
    },
  },
  setup(props, context) {
    const { dateOnlyLongString } = useFormatters();
    const { mobile: isMobile } = useDisplay();

    const requestedAssessments = ref([] as RequestAssessmentSummaryAPIOutDTO[]);
    // Adding watch effect instead of onMounted because
    // applicationId may not be not available on load.
    watchEffect(async () => {
      if (props.applicationId) {
        requestedAssessments.value =
          await StudentAssessmentsService.shared.getAssessmentRequest(
            props.applicationId,
            props.studentId,
          );
      }
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
      ITEMS_PER_PAGE,
      requestedAssessments,
      dateOnlyLongString,
      viewRequestForm,
      UnapprovedChangesHeaders,
      isMobile,
    };
  },
});
</script>
