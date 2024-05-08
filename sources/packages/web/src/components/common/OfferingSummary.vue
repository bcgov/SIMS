<template>
  <body-header
    title="Study period offerings"
    :recordsCount="offeringsAndCount.count"
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
    <toggle-content :toggled="!offeringsAndCount.count">
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
        <Column
          :field="OfferingSummaryFields.OfferingName"
          header="Name"
          :sortable="true"
        ></Column>
        <Column
          :field="OfferingSummaryFields.YearOfStudy"
          header="Year of Study"
        ></Column>
        <Column :field="OfferingSummaryFields.StudyDates" header="Study Dates">
          <template #body="slotProps">
            {{ dateOnlyLongString(slotProps.data.studyStartDate) }} -
            {{ dateOnlyLongString(slotProps.data.studyEndDate) }}
          </template></Column
        >
        <Column
          :field="OfferingSummaryFields.OfferingIntensity"
          header="Intensity"
        >
        </Column>
        <Column field="offeringType" header="Offering type" />
        <Column
          :field="OfferingSummaryFields.OfferingDelivered"
          header="Study delivery"
        />
        <Column header="Status"
          ><template #body="slotProps">
            <status-chip-offering
              :status="slotProps.data.offeringStatus"
            /> </template
        ></Column>
        <Column header="Action">
          <template #body="slotProps">
            <v-btn
              color="primary"
              variant="text"
              @click="offeringButtonAction(slotProps.data.id)"
              append-icon="mdi-pencil-outline"
            >
              {{ offeringActionLabel }}
            </v-btn>
          </template>
        </Column>
      </DataTable>
    </toggle-content>
  </content-group>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref, computed, defineComponent } from "vue";
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
} from "@/types";
import { EducationProgramOfferingSummaryAPIOutDTO } from "@/services/http/dto";
import { useFormatters } from "@/composables";
import { AuthService } from "@/services/AuthService";
import StatusChipOffering from "@/components/generic/StatusChipOffering.vue";

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
    const currentPage = ref();
    const currentPageLimit = ref();
    const { dateOnlyLongString } = useFormatters();
    const clientType = computed(() => AuthService.shared.authClientType);

    const isInstitutionUser = computed(() => {
      return clientType.value === ClientIdType.Institution;
    });

    const allowOfferingEdit = computed(() => {
      return isInstitutionUser.value || props.isEditAllowed;
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
      offeringsAndCount.value =
        await EducationProgramOfferingService.shared.getOfferingsSummary(
          props.locationId,
          props.programId,
          {
            searchCriteria: searchBox.value,
            sortField,
            sortOrder,
            page,
            pageLimit: pageCount,
          },
        );
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
      allowOfferingEdit,
    };
  },
});
</script>
