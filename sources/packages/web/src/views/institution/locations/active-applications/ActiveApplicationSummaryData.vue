<template>
  <body-header
    :title="header"
    :subTitle="subTitle"
    :recordsCount="disbursements.results?.length"
    class="m-1"
  >
    <template #actions>
      <InputText
        type="text"
        placeholder="Search name or application"
        v-model="searchCriteria"
        @keyup.enter="searchActiveApplications"
      />
      <v-btn
        class="ml-2 primary-btn-background"
        @click="searchActiveApplications"
        ><font-awesome-icon :icon="['fas', 'search']" class="mr-2"
      /></v-btn>
    </template>
  </body-header>
</template>

<script lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { InstitutionService } from "@/services/InstitutionService";
import {
  ApplicationStatus,
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  DataTableSortOrder,
  DEFAULT_PAGE_NUMBER,
  PageAndSortEvent,
} from "@/types";
import { ActiveApplicationSummaryAPIOutDTO } from "@/services/http/dto";
import { useFormatters } from "@/composables";
const DEFAULT_SORT_FIELD = "coeStatus";

export default {
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    locationName: {
      type: String,
      required: true,
    },
  },

  setup(props: any) {
    const router = useRouter();
    const page = ref(DEFAULT_PAGE_NUMBER);
    const pageLimit = ref(DEFAULT_PAGE_LIMIT);
    const sortField = ref(DEFAULT_SORT_FIELD);
    const sortOrder = ref(DataTableSortOrder.ASC);
    const searchCriteria = ref();

    const { dateString } = useFormatters();
    const applications = ref([] as ActiveApplicationSummaryAPIOutDTO[]);

    const goToApplicationView = (applicationId: number) => {
      router.push({
        name: InstitutionRoutesConst.ACTIVE_APPLICATION_EDIT,
        params: { locationId: props.locationId, applicationId },
      });
    };

    const updateSummaryList = async (locationId: number) => {
      applications.value =
        await InstitutionService.shared.getActiveApplicationsSummary(
          locationId,
        );
    };

    const pageEvent = async (event: PageAndSortEvent) => {
      page.value = event?.page;
      pageLimit.value = event?.rows;
      await updateSummaryList(props.locationId);
    };

    const sortEvent = async (event: PageAndSortEvent) => {
      page.value = DEFAULT_PAGE_NUMBER;
      pageLimit.value = DEFAULT_PAGE_LIMIT;
      sortField.value = event.sortField;
      sortOrder.value = event.sortOrder;
      await updateSummaryList(props.locationId);
    };

    const searchActiveApplications = async () => {
      page.value = DEFAULT_PAGE_NUMBER;
      pageLimit.value = DEFAULT_PAGE_LIMIT;
      await updateSummaryList(props.locationId);
    };

    watch(
      () => props.locationId,
      async (currValue) => {
        //update the list
        await updateSummaryList(currValue);
      },
    );

    onMounted(async () => {
      await updateSummaryList(props.locationId);
    });

    const getApplicationStatusColorClass = (status: string) => {
      if (ApplicationStatus.completed === status) {
        return "bg-success text-white";
      }
    };

    return {
      applications,
      dateString,
      goToApplicationView,
      getApplicationStatusColorClass,
      pageEvent,
      sortEvent,
      searchActiveApplications,
    };
  },
};
</script>
