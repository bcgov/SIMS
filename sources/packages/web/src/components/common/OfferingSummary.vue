<template>
  <body-header
    title="Study period offerings"
    :records-count="offeringsAndCount.count"
  >
    <template #actions>
      <v-row class="m-0 p-0">
        <v-text-field
          density="compact"
          label="Search Offering Name"
          variant="outlined"
          v-model="searchBox"
          data-cy="searchBox"
          @keyup.enter="searchOfferingTable"
          prepend-inner-icon="mdi-magnify"
          hide-details="auto"
        />
        <v-btn
          v-if="allowOfferingEdit"
          class="ml-2 float-right"
          @click="goToAddNewOffering()"
          color="primary"
          prepend-icon="fa:fa fa-plus-circle"
          data-cy="addNewOfferingButton"
        >
          Add offering
        </v-btn>
      </v-row>
    </template>
  </body-header>
  <content-group>
    <toggle-content
      :toggled="!offeringsAndCount.count && !loading"
      message="No study period offerings found."
    >
      <v-data-table-server
        v-if="offeringsAndCount?.count"
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
        <template #[`item.offeringName`]="{ item }">
          {{ item.name }}
        </template>
        <template #[`item.yearOfStudy`]="{ item }">
          {{ item.yearOfStudy }}
        </template>
        <template #[`item.offeringIntensity`]="{ item }">
          {{ item.offeringIntensity }}
        </template>
        <template #[`item.studyDates`]="{ item }">
          {{ dateOnlyLongString(item.studyStartDate) }} -
          {{ dateOnlyLongString(item.studyEndDate) }}
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
    const { dateOnlyLongString } = useFormatters();
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
              searchCriteria: searchBox.value,
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
      await getEducationProgramAndOffering();
    };

    // Search offering table.
    const searchOfferingTable = async () => {
      await getEducationProgramAndOffering();
    };

    return {
      goToAddNewOffering,
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
      dateOnlyLongString,
      allowOfferingEdit,
      OfferingSummaryHeaders,
      isMobile,
    };
  },
});
</script>
