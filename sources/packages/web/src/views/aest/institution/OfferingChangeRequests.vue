<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        title="Institution requests"
        subTitle="Offering Change Requests"
      />
    </template>
    <body-header
      title="Pending offering change requests"
      :recordsCount="offeringChangeRequests.length"
      subTitle="Offering change requests that require ministry review."
    />
    <content-group>
      <toggle-content :toggled="!offeringChangeRequests.length">
        <v-data-table
          :headers="PendingOfferingChangeRequestsHeaders"
          :items="offeringChangeRequests"
          :items-per-page="pageLimit"
          :items-per-page-options="paginationOptions"
        >
          <template #[`item.submittedDate`]="{ item }">
            <span>
              {{ dateOnlyLongString(item.submittedDate) }}
            </span>
          </template>
          <template #[`item.actions`]="{ item }">
            <v-btn
              color="primary"
              @click="
                viewOfferingChangeRequest(item.offeringId, item.programId)
              "
            >
              View request
            </v-btn>
          </template>
        </v-data-table>
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
  PendingOfferingChangeRequestsHeaders,
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

    const paginationOptions = PAGINATION_LIST.map((option) => ({
      value: option,
      title: option.toString(),
    }));

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
      PendingOfferingChangeRequestsHeaders,
      paginationOptions,
      offeringChangeRequests,
      dateOnlyLongString,
      viewOfferingChangeRequest,
    };
  },
});
</script>
