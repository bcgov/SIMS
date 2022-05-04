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
        variant="outlined"
        color="#2965C5"
      >
        <v-icon size="25" left> mdi-open-in-new </v-icon>
        Add Study Period
      </v-btn>
    </div>
  </div>
  <DataTable
    :value="offeringsAndCount.results"
    :lazy="true"
    :paginator="true"
    :rows="DEFAULT_PAGE_LIMIT"
    :rowsPerPageOptions="PAGINATION_LIST"
    :totalRecords="offeringsAndCount.count"
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
        {{ dateOnlyLongString(slotProps.data.studyStartDate) }} -
        {{ dateOnlyLongString(slotProps.data.studyEndDate) }}
      </template></Column
    >
    <Column :field="OfferingSummaryFields.OfferingIntensity" header="Intensity">
    </Column>
    <Column
      :field="OfferingSummaryFields.OfferingDelivered"
      header="Study Delivery"
    />
    <Column field="offeringType" header="Offering Type" />
    <Column header="Status"
      ><template #body="slotProps">
        <status-chip-offering
          :status="slotProps.data.offeringStatus"
        /> </template
    ></Column>
    <Column>
      <template #body="slotProps">
        <v-btn
          variant="outlined"
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
  ClientIdType,
  OfferingSummaryFields,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  DataTableSortOrder,
  PAGINATION_LIST,
  PaginatedResults,
  EducationProgramOfferingDto,
} from "@/types";
import { useFormatters } from "@/composables";
import { AuthService } from "@/services/AuthService";
import StatusChipOffering from "@/components/generic/StatusChipOffering.vue";

export default {
  components: {
    StatusChipOffering,
  },
  props: {
    programId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const loading = ref(false);
    const searchBox = ref("");
    const currentPage = ref();
    const currentPageLimit = ref();
    const { dateOnlyLongString } = useFormatters();
    const clientType = computed(() => AuthService.shared.authClientType);

    const isInstitutionUser = computed(() => {
      return clientType.value === ClientIdType.Institution;
    });
    const isAESTUser = computed(() => {
      return clientType.value === ClientIdType.AEST;
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
            institutionId: props.institutionId,
          },
        });
      }
    };

    const offeringsAndCount = ref(
      {} as PaginatedResults<EducationProgramOfferingDto>,
    );

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
        offeringsAndCount.value =
          await EducationProgramOfferingService.shared.getAllEducationProgramOffering(
            props.locationId,
            props.programId,
            page,
            pageCount,
            searchBox.value,
            sortField,
            sortOrder,
          );
      } else if (isAESTUser.value) {
        offeringsAndCount.value =
          await EducationProgramOfferingService.shared.getOfferingSummaryForAEST(
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
      dateOnlyLongString,
    };
  },
};
</script>
