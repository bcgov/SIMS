<template>
  <div class="p-m-4">
    <HeaderNavigator :title="locationName" :subTitle="'Programs'" />
    <v-container>
      <v-sheet elevation="1" class="mx-auto">
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-btn class="float-right" @click="goToAddNewProgram()">
                <v-icon size="25" left> mdi-open-in-new </v-icon>
                Create New Program
              </v-btn>
            </v-col>
          </v-row>
          <DataTable :autoLayout="true" :value="programs">
            <Column field="cipCode" header="CIP" :sortable="true"></Column>
            <Column
              field="name"
              header="Program Name"
              :sortable="true"
            ></Column>
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
                <Chip
                  :label="slotProps.data.approvalStatus"
                  class="p-mr-2 p-mb-2 p-text-uppercase"
                  :class="
                    getProgramStatusColorClass(slotProps.data.approvalStatus)
                  "/></template
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
      </v-sheet>
    </v-container>
  </div>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { EducationProgramService } from "../../../../services/EducationProgramService";
import { InstitutionRoutesConst } from "../../../../constants/routes/RouteConstants";
import { SummaryEducationProgramDto, ApprovalStatus } from "../../../../types";
import { ref, watch, onMounted } from "vue";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";

export default {
  components: {
    HeaderNavigator,
  },
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

    const getProgramStatusColorClass = (status: string) => {
      switch (status) {
        case ApprovalStatus.approved:
          return "bg-info text-white";
        case ApprovalStatus.pending:
          return "bg-warning text-white";
        default:
          return "";
      }
    };
    return {
      programs,
      goToAddNewProgram,
      goToViewProgram,
      getProgramStatusColorClass,
    };
  },
};
</script>
