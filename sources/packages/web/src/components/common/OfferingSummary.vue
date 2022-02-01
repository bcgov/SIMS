<template>
  <div>
    <span class="category-header-medium">Study period offerings</span>

    <div class="float-right">
      <InputText
        name="searchProgramName"
        v-model="searchBox"
        placeholder="Search Offering Name"
        @keyup.enter="searchOfferingTable()"
      />
      <v-btn class="ml-2 primary-btn-background" @click="searchOfferingTable()"
        ><font-awesome-icon :icon="['fas', 'search']"
      /></v-btn>
      <v-btn
        v-if="isInstitutionUser"
        class="ml-2"
        @click="goToAddNewOffering()"
        outlined
        color="#2965C5"
      >
        <v-icon size="25" left>
          mdi-open-in-new
        </v-icon>
        Add Study Period
      </v-btn>
    </div>
  </div>
  <DataTable
    :value="offeringsAndCount.offeringSummary"
    :lazy="true"
    :paginator="true"
    :rows="DEFAULT_PAGE_LIMIT"
    :rowsPerPageOptions="PAGINATION_LIST"
    :totalRecords="offeringsAndCount.totalOfferings"
    @page="paginationAndSortEvent($event)"
    @sort="paginationAndSortEvent($event)"
    :loading="loading"
  >
    <template #empty>
      <p class="text-center font-weight-bold">No records found.</p>
    </template>
    <Column
      :field="OfferingSummaryFields.OfferingName"
      header="Name"
      :sortable="true"
    ></Column>
    <Column :field="OfferingSummaryFields.StudyDates" header="Study Dates">
      <template #body="slotProps">
        {{ formatDate(slotProps.data.studyStartDate, DATE_FORMAT) }} -
        {{ formatDate(slotProps.data.studyEndDate, DATE_FORMAT) }}
      </template></Column
    >
    <Column :field="OfferingSummaryFields.OfferingIntensity" header="Type"
      ><template #body="slotProps">
        <span>{{ slotProps.data.offeringIntensity }} </span>
      </template>
    </Column>
    <Column
      :field="OfferingSummaryFields.OfferingDelivered"
      header="Study Delivery"
    ></Column>
    <Column>
      <template #body="slotProps">
        <v-btn
          outlined
          @click="offeringButtonAction(slotProps.data.id)"
          color="#2965C5"
        >
          {{ offeringActionLabel }}
        </v-btn>
      </template>
    </Column>
  </DataTable>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref, computed } from "vue";
import {
  InstitutionRoutesConst,
  AESTRoutesConst,
} from "@/constants/routes/RouteConstants";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import {
  PaginatedOffering,
  ClientIdType,
  OfferingSummaryFields,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  DataTableSortOrder,
  PAGINATION_LIST,
} from "@/types";
import { useFormatters } from "@/composables";

export default {
  props: {
    programId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
    clientType: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const loading = ref(false);
    const searchBox = ref("");
    const currentPage = ref();
    const currentPageLimit = ref();
    const { formatDate } = useFormatters();
    const DATE_FORMAT = "MMMM, D YYYY";

    const isInstitutionUser = computed(() => {
      return props.clientType === ClientIdType.Institution;
    });
    const isAESTUser = computed(() => {
      return props.clientType === ClientIdType.AEST;
    });
    const offeringActionLabel = computed(() => {
      return isInstitutionUser.value ? "Edit" : "View";
    });

    const goToAddNewOffering = () => {
      if (isInstitutionUser.value) {
        router.push({
          name: InstitutionRoutesConst.ADD_LOCATION_OFFERINGS,
          params: {
            locationId: props.locationId,
            programId: props.programId,
            clientType: ClientIdType.Institution,
          },
        });
      }
    };

    const offeringButtonAction = (offeringId: number) => {
      if (isInstitutionUser.value) {
        router.push({
          name: InstitutionRoutesConst.EDIT_LOCATION_OFFERINGS,
          params: {
            offeringId: offeringId,
            programId: props.programId,
            locationId: props.locationId,
            clientType: ClientIdType.Institution,
          },
        });
      }
      if (isAESTUser.value) {
        router.push({
          name: AESTRoutesConst.VIEW_OFFERING,
          params: {
            offeringId: offeringId,
            programId: props.programId,
            locationId: props.locationId,
            clientType: ClientIdType.AEST,
          },
        });
      }
    };

    const offeringsAndCount = ref({} as PaginatedOffering);

    /**
     * function to load offeringsAndCount respective to the client type
     * @param page page number, if nothing passed then DEFAULT_PAGE_NUMBER
     * @param pageCount page limit, if nothing passed then DEFAULT_PAGE_LIMIT
     * @param sortField sort field, if nothing passed then UserFields.DisplayName
     * @param sortOrder sort oder, if nothing passed then DataTableSortOrder.DESC
     */
    const getEducationProgramAndOffering = async (
      page = DEFAULT_PAGE_NUMBER,
      pageCount = DEFAULT_PAGE_LIMIT,
      sortField = OfferingSummaryFields.OfferingName,
      sortOrder = DataTableSortOrder.ASC,
    ) => {
      loading.value = true;
      if (isInstitutionUser.value) {
        offeringsAndCount.value = await EducationProgramOfferingService.shared.getAllEducationProgramOffering(
          props.locationId,
          props.programId,
          page,
          pageCount,
          searchBox.value,
          sortField,
          sortOrder,
        );
      } else if (isAESTUser.value) {
        offeringsAndCount.value = await EducationProgramOfferingService.shared.getOfferingSummaryForAEST(
          props.locationId,
          props.programId,
          page,
          pageCount,
          searchBox.value,
          sortField,
          sortOrder,
        );
      }
      loading.value = false;
    };

    onMounted(getEducationProgramAndOffering);

    // pagination sort event callback
    const paginationAndSortEvent = async (event: any) => {
      currentPage.value = event?.page;
      currentPageLimit.value = event?.rows;
      await getEducationProgramAndOffering(
        event.page,
        event.rows,
        event.sortField,
        event.sortOrder,
      );
    };

    // search offering table
    const searchOfferingTable = async () => {
      await getEducationProgramAndOffering(
        currentPage.value ?? DEFAULT_PAGE_NUMBER,
        currentPageLimit.value ?? DEFAULT_PAGE_LIMIT,
      );
    };

    return {
      goToAddNewOffering,
      offeringsAndCount,
      offeringButtonAction,
      isInstitutionUser,
      isAESTUser,
      offeringActionLabel,
      paginationAndSortEvent,
      loading,
      searchOfferingTable,
      searchBox,
      OfferingSummaryFields,
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      formatDate,
      DATE_FORMAT,
    };
  },
};
</script>
