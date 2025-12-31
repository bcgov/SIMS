<template>
  <body-header
    title="Study period offerings"
    :records-count="offeringsAndCount.count"
  >
    <template #actions>
      <v-form ref="searchOfferingsForm">
        <div class="d-flex flex-wrap align-center ga-3">
          <!-- Search Field -->
          <v-text-field
            density="compact"
            label="Search Offering Name"
            variant="outlined"
            v-model="searchBox"
            data-cy="searchBox"
            @update:model-value="debouncedSearch"
            @keyup.enter="searchOfferingTable"
            prepend-inner-icon="mdi-magnify"
            hide-details="auto"
            class="flex-grow-1"
          />

          <!-- Date Range Group - stays together -->
          <div class="d-flex align-center ga-2 flex-grow-1">
            <v-date-input
              density="compact"
              variant="outlined"
              label="From (Study Start Date)"
              input-format="yyyy-mm-dd"
              hide-details="auto"
              prepend-icon=""
              append-inner-icon="mdi-calendar"
              v-model="startDate"
              @update:model-value="debouncedSearch"
            />
            <v-date-input
              density="compact"
              variant="outlined"
              label="To (Study Start Date)"
              input-format="yyyy-mm-dd"
              hide-details="auto"
              prepend-icon=""
              append-inner-icon="mdi-calendar"
              v-model="endDate"
              @update:model-value="debouncedSearch"
            />
            <tooltip-icon>
              This date range allows you to filter by the study start date.
              <br />
              To show offerings for a specific program year enter
              <br />
              August 1st 20XX in the first entry field and then enter <br />
              July 31st 20YY where program year is 20XX - 20YY.
            </tooltip-icon>
          </div>

          <!-- Search Button -->
          <v-btn
            color="primary"
            data-cy="searchOfferings"
            @click="searchOfferingTable()"
            prepend-icon="mdi-magnify"
            style="margin-left: auto; flex-shrink: 0"
          >
            Search
          </v-btn>

          <!-- Intensity Filter Group -->
          <v-btn-toggle
            v-model="intensityFilter"
            density="compact"
            class="btn-toggle"
            selected-class="selected-btn-toggle"
            mandatory
            @click="searchOfferingTable()"
          >
            <v-btn
              rounded="xl"
              color="primary"
              value="All"
              size="small"
              class="mr-1"
              >All</v-btn
            >
            <v-btn
              rounded="xl"
              color="primary"
              value="Full Time"
              size="small"
              class="mr-1"
              >Full-time</v-btn
            >
            <v-btn
              rounded="xl"
              color="primary"
              value="Part Time"
              size="small"
              class="mr-1"
              >Part-time</v-btn
            >
          </v-btn-toggle>
        </div>
        <!-- Error display at bottom -->
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
          {{ mapOfferingIntensity(item.offeringIntensity) }}
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
import { useFormatters, useOffering, useSnackBar } from "@/composables";
import { AuthService } from "@/services/AuthService";
import StatusChipOffering from "@/components/generic/StatusChipOffering.vue";
import { debounce } from "lodash";

const DEFAULT_SORT_FIELD = "name";

/**
 * Interface for offering filter options.
 */
interface OfferingFilterOptions {
  searchCriteria?: string;
  intensityFilter?: string;
  studyStartDateFromFilter?: string;
  studyStartDateToFilter?: string;
}

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
    isOfferingEditAllowed: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const router = useRouter();
    const { capitalizeFirstWord } = useFormatters();
    const loading = ref<boolean>(false);
    const searchBox = ref<string>();
    const { dateOnlyLongPeriodString } = useFormatters();
    const intensityFilter = ref<OfferingIntensity | "All">("All");
    const startDate = ref<string>();
    const endDate = ref<string>();
    const searchOfferingsForm = ref({} as VForm);
    const offeringsAndCount = ref(
      {} as PaginatedResults<EducationProgramOfferingSummaryAPIOutDTO>,
    );
    const { mapOfferingIntensity } = useOffering();

    const { mobile: isMobile } = useDisplay();
    const snackBar = useSnackBar();

    const clientType = computed(() => AuthService.shared.authClientType);

    const isInstitutionUser = computed(() => {
      return clientType.value === ClientIdType.Institution;
    });

    const isAESTUser = computed(() => {
      return clientType.value === ClientIdType.AEST;
    });
    const offeringActionLabel = computed(() => {
      return props.isOfferingEditAllowed ? "Edit" : "View";
    });

    /**
     * Debounced version of the search function with a 2000ms (2 second) delay
     */
    const debouncedSearch = debounce(() => {
      searchOfferingTable();
    }, 2000); // 2000 milliseconds delay

    /**
     * Handles the action when the offering button is clicked.
     * @param offeringId The ID of the offering.
     */
    const offeringButtonAction = (offeringId: number) => {
      const params = {
        offeringId,
        programId: props.programId,
        locationId: props.locationId,
      };

      // Navigate based on user type.
      if (isAESTUser.value) {
        // Ministry user has a different route / parameters.
        router.push({
          name: AESTRoutesConst.VIEW_OFFERING,
          params: {
            ...params,
            institutionId: props.institutionId,
          },
        });
      } else {
        const routeName = props.isOfferingEditAllowed
          ? InstitutionRoutesConst.EDIT_LOCATION_OFFERINGS
          : InstitutionRoutesConst.VIEW_LOCATION_OFFERINGS;

        router.push({
          name: routeName,
          params: params,
        });
      }
    };

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
        const filterOptions: OfferingFilterOptions = {};
        if (searchBox.value) {
          filterOptions.searchCriteria = searchBox.value;
        }
        if (intensityFilter.value && intensityFilter.value !== "All") {
          filterOptions.intensityFilter = intensityFilter.value;
        }
        if (startDate.value) {
          filterOptions.studyStartDateFromFilter = startDate.value;
        }
        if (endDate.value) {
          filterOptions.studyStartDateToFilter = endDate.value;
        }

        offeringsAndCount.value =
          await EducationProgramOfferingService.shared.getOfferingsSummary(
            props.locationId,
            props.programId,
            {
              searchCriteria: filterOptions as Record<string, string>,
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

    /**
     * Search offering table.
     * */
    const searchOfferingTable = async () => {
      const validationResult = await searchOfferingsForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      await getEducationProgramAndOffering();
    };

    /**
     * Validates the search date range.
     * @returns True if valid, error message string otherwise.
     */
    const isValidSearch = () => {
      // If no dates provided, it's valid.
      if (!startDate.value && !endDate.value) {
        return true;
      }

      // If only one date is provided or end date is not after start date.
      if (
        !startDate.value ||
        !endDate.value ||
        new Date(endDate.value) <= new Date(startDate.value)
      ) {
        return "Both dates are required and must be valid.";
      }

      return true;
    };

    return {
      offeringsAndCount,
      offeringButtonAction,
      isInstitutionUser,
      offeringActionLabel,
      pageSortEvent,
      loading,
      searchOfferingTable,
      debouncedSearch,
      searchBox,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      dateOnlyLongPeriodString,
      OfferingSummaryHeaders,
      isMobile,
      intensityFilter,
      startDate,
      endDate,
      capitalizeFirstWord,
      searchOfferingsForm,
      isValidSearch,
      mapOfferingIntensity,
    };
  },
});
</script>
