<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Institution requests"
        subTitle="Study Period Offerings"
      />
    </template>
    <body-header
      title="Requested changes"
      :recordsCount="offeringChangeRequests.length"
      subTitle="Make a determination on requested change(s) that may require a reassessment."
    />
    <content-group>
      <toggle-content :toggled="!offeringChangeRequests.length">
        <DataTable
          :value="offeringChangeRequests"
          class="p-m-4"
          :paginator="true"
          :rows="pageLimit"
          :rowsPerPageOptions="PAGINATION_LIST"
        >
          <Column
            field="submittedDate"
            :sortable="true"
            header="Date submitted"
          >
            <template #body="slotProps">
              <span>
                {{ dateOnlyLongString(slotProps.data.submittedDate) }}
              </span>
            </template>
          </Column>
          <Column field="institutionName" header="Institution Name"> </Column>
          <Column field="locationName" header="Location Name"></Column>
          <Column field="offeringName" header="Study period name"></Column>
          <Column header="Action">
            <template #body="slotProps">
              <v-btn
                color="primary"
                @click="
                  gotToAssessmentsSummary(
                    slotProps.data.applicationId,
                    slotProps.data.studentId,
                  )
                "
                >View request</v-btn
              >
            </template>
          </Column>
        </DataTable>
      </toggle-content>
    </content-group>
  </full-page-container>
</template>
<script lang="ts">
import { ref, onMounted } from "vue";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import {
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  DEFAULT_PAGE_NUMBER,
} from "@/types";
import { useFormatters } from "@/composables";
import { OfferingChangeRequestAPIOutDTO } from "@/services/http/dto/EducationProgramOffering.dto";

export default {
  setup() {
    const page = ref(DEFAULT_PAGE_NUMBER);
    const pageLimit = ref(DEFAULT_PAGE_LIMIT);
    const searchCriteria = ref();
    const { dateOnlyLongString } = useFormatters();
    const offeringChangeRequests = ref([] as OfferingChangeRequestAPIOutDTO[]);

    onMounted(async () => {
      offeringChangeRequests.value =
        await EducationProgramOfferingService.shared.getOfferingChangeRequests();
    });

    return {
      page,
      pageLimit,
      searchCriteria,
      offeringChangeRequests,
      PAGINATION_LIST,
      dateOnlyLongString,
    };
  },
};
</script>
