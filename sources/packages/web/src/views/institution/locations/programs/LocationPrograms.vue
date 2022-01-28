<template>
  <v-container>
    <p class="muted-heading-text">{{ locationDetails?.locationName }}</p>
    <p class="heading-x-large">Programs</p>
    <v-card class="mt-4">
      <v-container>
        <div>
          <span class="color-blue category-header-large ml-2"
            >All programs</span
          >
          <v-btn
            class="float-right mb-2 primary-btn-background"
            @click="goToAddNewProgram()"
          >
            <v-icon size="25" left> mdi-open-in-new </v-icon>
            Create New Program
          </v-btn>
        </div>
        <DataTable :autoLayout="true" :value="programs">
          <Column field="cipCode" header="CIP" :sortable="true"></Column>
          <Column field="name" header="Program Name" :sortable="true"></Column>
          <Column field="credentialType" header="Credential" :sortable="true">
            <template #body="slotProps">
              <div>
                {{ slotProps.data.credentialTypeToDisplay }}
              </div>
            </template></Column
          >
          <Column
            field="totalOfferings"
            header="Offerings"
            :sortable="true"
          ></Column>
          <Column field="approvalStatus" header="Status" :sortable="true"
            ><template #body="slotProps">
              <status-badge
                :status="
                  getProgramStatusToGeneralStatus(slotProps.data.approvalStatus)
                "
              ></status-badge></template
          ></Column>
          <Column>
            <template #body="slotProps">
              <v-btn outlined @click="goToViewProgram(slotProps.data.id)"
                >View</v-btn
              >
            </template>
          </Column>
        </DataTable>
      </v-container>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { EducationProgramService } from "@/services/EducationProgramService";
import { InstitutionService } from "@/services/InstitutionService";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import {
  SummaryEducationProgramDto,
  ClientIdType,
  EducationProgramsSummaryPaginated,
  SortDBOrder,
} from "@/types";
import { ref, watch, onMounted } from "vue";
import StatusBadge from "@/components/generic/StatusBadge.vue";
import { useFormatStatuses } from "@/composables";

export default {
  components: { StatusBadge },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const programAndCount = ref({} as EducationProgramsSummaryPaginated);
    const programs = ref([] as SummaryEducationProgramDto[]);
    const { getProgramStatusToGeneralStatus } = useFormatStatuses();
    const locationDetails = ref();
    const searchProgramName = ref("");
    const DEFAULT_PAGE = 0;
    const DEFAULT_ROW_SIZE = 10;
    const currentPageSize = ref();
    const DEFAULT_SORT_COLUMN = "submittedDate";
    const DEFAULT_SORT_ORDER = SortDBOrder.DESC;
    const loading = ref(false);

    const loadSummary = async () => {
      programAndCount.value = await EducationProgramService.shared.getLocationProgramsSummary(
        props.locationId,
      );
      programs.value = programAndCount.value.programsSummary;
    };

    onMounted(async () => {
      await loadSummary();
      locationDetails.value = await InstitutionService.shared.getInstitutionLocation(
        props.locationId,
      );
    });
    watch(() => props.locationId, loadSummary);

    const goToAddNewProgram = () => {
      router.push({
        name: InstitutionRoutesConst.ADD_LOCATION_PROGRAMS,
        params: {
          locationId: props.locationId,
          clientType: ClientIdType.Institution,
        },
      });
    };

    const goToViewProgram = (programId: number) => {
      router.push({
        name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
        params: {
          programId,
          locationId: props.locationId,
        },
      });
    };
    return {
      programs,
      goToAddNewProgram,
      goToViewProgram,
      getProgramStatusToGeneralStatus,
      locationDetails,
    };
  },
};
</script>
