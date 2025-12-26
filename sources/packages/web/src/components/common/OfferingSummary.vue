<template>
  <body-header
    title="Study period offerings"
    :records-count="offeringsAndCount.count"
  >
    <template #actions>
      <v-form ref="searchOfferingsForm">
        <v-row class="m-0 p-0 align-center">
          <v-text-field
            density="compact"
            label="Search Offering Name"
            variant="outlined"
            v-model="searchBox"
            data-cy="searchBox"
            @keyup.enter="searchOfferingTable"
            prepend-inner-icon="mdi-magnify"
            hide-details="auto"
            class="ml-2 mr-2"
          />
          <v-date-input
            density="compact"
            variant="outlined"
            label="Study Start Date (From)"
            class="mr-2"
            hide-details="auto"
            prepend-icon=""
            append-inner-icon="mdi-calendar"
            v-model="startDate"
          />
          <v-date-input
            density="compact"
            variant="outlined"
            label="Study Start Date (To)"
            class="mr-2"
            hide-details="auto"
            prepend-icon=""
            append-inner-icon="mdi-calendar"
            v-model="endDate"
          />
          <tooltip-icon>
            This date range allows you to filter by the study start date. To
            show offerings for a specific program year enter August 1st 20XX in
            the first entry field and then enter July 31st 20YY where program
            year is 20XX - 20YY.
          </tooltip-icon>
          <v-btn-toggle
            v-model="intensityFilter"
            density="compact"
            class="btn-toggle"
            selected-class="selected-btn-toggle"
            mandatory
          >
            <v-btn rounded="xl" color="primary" value="all" class="ml-2 mr-2"
              >All</v-btn
            >
            <v-btn rounded="xl" color="primary" value="fullTime" class="mr-2"
              >Full-time</v-btn
            >
            <v-btn rounded="xl" color="primary" value="partTime" class="mr-2"
              >Part-time</v-btn
            >
          </v-btn-toggle>
          <v-btn
            color="primary"
            class="p-button-raised"
            data-cy="searchOfferings"
            @click="searchOfferingTable()"
          >
            Search
          </v-btn>
        </v-row>
        <v-input :rules="[isValidSearch()]" hide-details="auto" error />
      </v-form>
    </template>
  </body-header>
  <content-group>
    <toggle-content
      :toggled="!offeringsAndCount.count && !loading"
      message="No study period offerings found."
    >
      <v-data-table-server
        :headers="OfferingSummaryHeaders"
        :items="offeringsAndCount?.results"
        :items-length="offeringsAndCount?.count"
        :loading="loading"
        item-value="id"
        :items-per-page="DEFAULT_PAGE_LIMIT"
        :items-per-page-options="ITEMS_PER_PAGE"
        :mobile="isMobile"
        @update:options="pageSortEvent"
      >
        <template #[`item.name`]="{ item }">
          {{ item.name }}
        </template>
        <template #[`item.yearOfStudy`]="{ item }">
          {{ item.yearOfStudy }}
        </template>
        <template #[`item.studyStartDate`]="{ item }">
          {{ item.studyStartDate }}
        </template>
        <template #[`item.studyEndDate`]="{ item }">
          {{ item.studyEndDate }}
        </template>
        <template #[`item.offeringIntensity`]="{ item }">
          {{ getOfferingIntensityText(item) }}
        </template>
        <template #[`item.offeringDelivered`]="{ item }">
          {{ capitalizeFirstWord(item.offeringDelivered) }}
        </template>
        <template #[`item.offeringStatus`]="{ item }">
          <status-chip-offering :status="item.offeringStatus" />
        </template>
        <template #[`item.action`]="{ item }">
          <v-btn
            color="primary"
            variant="text"
            @click="offeringButtonAction(item.id)"
            append-icon="mdi-pencil-outline"
          >
            {{ offeringActionLabel }}
          </v-btn>
        </template>
      </v-data-table-server>
    </toggle-content>
  </content-group>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref, computed, defineComponent } from "vue";
import { useDisplay } from "vuetify";

import {
  InstitutionRoutesConst,
  AESTRoutesConst,
} from "@/constants/routes/RouteConstants";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import {
  ClientIdType,
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  DEFAULT_DATATABLE_PAGE_NUMBER,
  PaginatedResults,
  OfferingSummaryHeaders,
  DataTableSortByOrder,
  DataTableOptions,
  PaginationOptions,
  VForm,
  OfferingIntensity,
} from "@/types";
import { EducationProgramOfferingSummaryAPIOutDTO } from "@/services/http/dto";
import { useFormatters, useInstitutionAuth, useSnackBar } from "@/composables";
import { AuthService } from "@/services/AuthService";
import StatusChipOffering from "@/components/generic/StatusChipOffering.vue";

const DEFAULT_SORT_FIELD = "name";

export default defineComponent({
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
    isEditAllowed: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  setup(props) {
    const router = useRouter();
    const loading = ref(false);
    const searchBox = ref("");
    const { dateOnlyLongPeriodString } = useFormatters();
    const intensityFilter = ref("all");
    const startDate = ref("");
    const endDate = ref("");
    const startDateMenu = ref(false);
    const endDateMenu = ref(false);
    const searchOfferingsForm = ref({} as VForm);

    function capitalizeFirstWord(str: string) {
      if (!str) return "";
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
    const { isReadOnlyUser } = useInstitutionAuth();

    const { mobile: isMobile } = useDisplay();
    const snackBar = useSnackBar();

    const clientType = computed(() => AuthService.shared.authClientType);

    const isInstitutionUser = computed(() => {
      return clientType.value === ClientIdType.Institution;
    });

    const allowOfferingEdit = computed(() => {
      return (
        isInstitutionUser.value &&
        props.isEditAllowed &&
        !isReadOnlyUser(props.locationId)
      );
    });

    const isAESTUser = computed(() => {
      return clientType.value === ClientIdType.AEST;
    });
    const offeringActionLabel = computed(() => {
      return allowOfferingEdit.value ? "Edit" : "View";
    });

    const offeringButtonAction = (offeringId: number) => {
      if (isInstitutionUser.value) {
        if (props.isEditAllowed) {
          router.push({
            name: InstitutionRoutesConst.EDIT_LOCATION_OFFERINGS,
            params: {
              offeringId: offeringId,
              programId: props.programId,
              locationId: props.locationId,
            },
          });
        } else {
          router.push({
            name: InstitutionRoutesConst.VIEW_LOCATION_OFFERINGS,
            params: {
              offeringId: offeringId,
              programId: props.programId,
              locationId: props.locationId,
            },
          });
        }
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
      {} as PaginatedResults<EducationProgramOfferingSummaryAPIOutDTO>,
    );

    /**
     * Current state of the pagination.
     */
    const currentPagination: PaginationOptions = {
      page: DEFAULT_DATATABLE_PAGE_NUMBER,
      pageLimit: DEFAULT_PAGE_LIMIT,
      sortField: DEFAULT_SORT_FIELD,
      sortOrder: DataTableSortByOrder.ASC,
    };

    /**
     * Loads study period offerings for the Institution Program.
     */
    const getEducationProgramAndOffering = async () => {
      try {
        loading.value = true;
        offeringsAndCount.value =
          await EducationProgramOfferingService.shared.getOfferingsSummary(
            props.locationId,
            props.programId,
            {
              searchCriteria: {
                searchCriteria: searchBox.value,
                intensity: intensityFilter.value,
                startDate: startDate.value,
                endDate: endDate.value,
              },
              ...currentPagination,
            },
          );
      } catch {
        snackBar.error("Unexpected error while loading Offerings.");
      } finally {
        loading.value = false;
      }
    };

    onMounted(getEducationProgramAndOffering);

    /**
     * Page/Sort event handler.
     * @param event The data table page/sort event.
     */
    const pageSortEvent = async (event: DataTableOptions) => {
      currentPagination.page = event.page;
      currentPagination.pageLimit = event.itemsPerPage;
      if (event.sortBy.length) {
        const [sortBy] = event.sortBy;
        currentPagination.sortField = sortBy.key;
        currentPagination.sortOrder = sortBy.order;
      } else {
        // Sorting was removed, reset to default.
        currentPagination.sortField = DEFAULT_SORT_FIELD;
        currentPagination.sortOrder = DataTableSortByOrder.ASC;
      }
      await searchOfferingTable();
    };

    // Search offering table.
    const searchOfferingTable = async () => {
      const validationResult = await searchOfferingsForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      await getEducationProgramAndOffering();
    };

    const isValidSearch = () => {
      if (!endDate.value && !startDate.value) {
        return true;
      } else if (
        (startDate.value && !endDate.value) ||
        (!startDate.value && endDate.value) ||
        new Date(endDate.value) <= new Date(startDate.value)
      ) {
        return "Both dates are required and must be valid.";
      }
      return true;
    };

    const getOfferingIntensityText = (item) => {
      if (item.offeringIntensity === OfferingIntensity.fullTime) {
        return "Full-Time";
      } else if (item.offeringIntensity === OfferingIntensity.partTime) {
        return "Part-Time";
      }
      return "";
    };

    return {
      offeringsAndCount,
      offeringButtonAction,
      isInstitutionUser,
      isAESTUser,
      offeringActionLabel,
      pageSortEvent,
      loading,
      searchOfferingTable,
      searchBox,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      dateOnlyLongPeriodString,
      allowOfferingEdit,
      OfferingSummaryHeaders,
      isMobile,
      intensityFilter,
      startDate,
      endDate,
      startDateMenu,
      endDateMenu,
      capitalizeFirstWord,
      searchOfferingsForm,
      isValidSearch,
      getOfferingIntensityText,
    };
  },
});
</script>
