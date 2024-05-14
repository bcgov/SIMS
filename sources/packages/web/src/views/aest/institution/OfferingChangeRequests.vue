<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        title="Institution requests"
        title-header-level="2"
        subTitle="Study Period Offerings"
      />
    </template>
    <body-header
      title="Requested changes"
      title-header-level="2"
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
                  viewOfferingChangeRequest(
                    slotProps.data.offeringId,
                    slotProps.data.programId,
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
import { ref, onMounted, defineComponent } from "vue";
import { useRouter } from "vue-router";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import {
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  DEFAULT_PAGE_NUMBER,
} from "@/types";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useFormatters } from "@/composables";
import { OfferingChangeRequestAPIOutDTO } from "@/services/http/dto/EducationProgramOffering.dto";

export default defineComponent({
  setup() {
    const router = useRouter();
    const page = ref(DEFAULT_PAGE_NUMBER);
    const pageLimit = ref(DEFAULT_PAGE_LIMIT);
    const searchCriteria = ref();
    const { dateOnlyLongString } = useFormatters();
    const offeringChangeRequests = ref([] as OfferingChangeRequestAPIOutDTO[]);

    onMounted(async () => {
      offeringChangeRequests.value =
        await EducationProgramOfferingService.shared.getOfferingChangeRequests();
    });

    const viewOfferingChangeRequest = (
      offeringId: number,
      programId: number,
    ) => {
      router.push({
        name: AESTRoutesConst.OFFERING_CHANGE_REQUEST_VIEW,
        params: { offeringId, programId },
      });
    };

    return {
      page,
      pageLimit,
      searchCriteria,
      offeringChangeRequests,
      PAGINATION_LIST,
      dateOnlyLongString,
      viewOfferingChangeRequest,
    };
  },
});
</script>
