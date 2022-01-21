<template>
  <v-container>
    <p class="muted-heading-text">{{ locationName }}</p>
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
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { SummaryEducationProgramDto } from "@/types";
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
    locationName: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const programs = ref([] as SummaryEducationProgramDto[]);
    const { getProgramStatusToGeneralStatus } = useFormatStatuses();

    const loadSummary = async () => {
      programs.value = await EducationProgramService.shared.getLocationProgramsSummary(
        props.locationId,
      );
    };

    onMounted(loadSummary);
    watch(() => props.locationId, loadSummary);

    const goToAddNewProgram = () => {
      router.push({
        name: InstitutionRoutesConst.ADD_LOCATION_PROGRAMS,
        params: { locationId: props.locationId },
      });
    };

    const goToViewProgram = (programId: number) => {
      router.push({
        name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
        params: {
          programId,
          locationId: props.locationId,
          locationName: props.locationName,
        },
      });
    };
    return {
      programs,
      goToAddNewProgram,
      goToViewProgram,
      getProgramStatusToGeneralStatus,
    };
  },
};
</script>
