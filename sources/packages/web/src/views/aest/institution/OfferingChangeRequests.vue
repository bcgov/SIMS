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
      <toggle-content
        :toggled="
          !offeringChangeRequests.length && !offeringChangeRequestsLoading
        "
        message="No offering change requests found."
      >
        <v-data-table
          :headers="PendingOfferingChangeRequestsHeaders"
          :items="offeringChangeRequests"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          :loading="offeringChangeRequestsLoading"
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
  ITEMS_PER_PAGE,
  PendingOfferingChangeRequestsHeaders,
} from "@/types";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useFormatters, useSnackBar } from "@/composables";
import { OfferingChangeRequestAPIOutDTO } from "@/services/http/dto/EducationProgramOffering.dto";

export default defineComponent({
  setup() {
    const snackBar = useSnackBar();
    const router = useRouter();
    const searchCriteria = ref();
    const offeringChangeRequestsLoading = ref(false);
    const { dateOnlyLongString } = useFormatters();
    const offeringChangeRequests = ref([] as OfferingChangeRequestAPIOutDTO[]);

    onMounted(async () => {
      offeringChangeRequestsLoading.value = true;
      try {
        offeringChangeRequests.value =
          await EducationProgramOfferingService.shared.getOfferingChangeRequests();
      } catch {
        snackBar.error(
          "An unexpected error happened while loading the offering change requests.",
        );
      } finally {
        offeringChangeRequestsLoading.value = false;
      }
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
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      offeringChangeRequestsLoading,
      searchCriteria,
      PendingOfferingChangeRequestsHeaders,
      offeringChangeRequests,
      dateOnlyLongString,
      viewOfferingChangeRequest,
    };
  },
});
</script>
