<template>
  <v-container>
    <p class="text-muted font-weight-bold h3">{{ locationName }}</p>
    <p class="font-weight-bold h2">Program Information Requests</p>
    <v-sheet elevation="1" class="mx-auto mt-2">
      <v-container>
        <p class="color-blue h3 font-weight-bold">New Applications</p>
        <p>
          New students have submitted applications for student aid funding or
          grants. Confirm students are enrolled for the programs specificed in
          their applications.
        </p>

        <DataTable
          :autoLayout="true"
          :value="applications"
          class="p-m-4"
          :paginator="true"
          :rows="10"
        >
          <Column field="firstName" header="Name">
            <template #body="slotProps">
              <span
                >{{ slotProps.data.firstName }}
                {{ slotProps.data.lastName }}</span
              >
            </template>
          </Column>
          <Column field="studyStartPeriod" header="Study Period">
            <template #body="slotProps">
              <span>
                {{ dateString(slotProps.data.studyStartPeriod) }} -
                {{ dateString(slotProps.data.studyEndPeriod) }}
              </span>
            </template></Column
          >
          <Column field="applicationNumber" header="Application #"></Column>
          <Column field="pirStatus" header="Status">
            <template #body="slotProps">
              <Chip
                :label="slotProps.data.pirStatus"
                class="p-mr-2 p-mb-2 text-uppercase"
                :class="getPirStatusColorClass(slotProps.data.pirStatus)"
              />
            </template>
          </Column>
          <Column field="applicationNumberId" header="">
            <template #body="slotProps">
              <v-btn
                plain
                color="primary"
                outlined
                @click="goToViewApplication(slotProps.data.applicationNumberId)"
                >view</v-btn
              >
            </template>
          </Column>
        </DataTable>
      </v-container>
    </v-sheet>
  </v-container>
</template>

<script lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { ProgramInfoRequestService } from "@/services/ProgramInfoRequestService";
import { PIRSummaryDTO } from "@/types";
import { useFormatters } from "@/composables";

export default {
  components: {},
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
    const { dateString } = useFormatters();
    const applications = ref([] as PIRSummaryDTO[]);

    const goToViewApplication = (applicationId: number) => {
      router.push({
        name: InstitutionRoutesConst.PROGRAM_INFO_REQUEST_EDIT,
        params: { locationId: props.locationId, applicationId },
      });
    };

    const updateSummaryList = async (locationId: number) => {
      applications.value = await ProgramInfoRequestService.shared.getPIRSummary(
        locationId,
      );
    };

    watch(
      () => props.locationId,
      async currValue => {
        //update the list
        await updateSummaryList(currValue);
      },
    );

    onMounted(async () => {
      await updateSummaryList(props.locationId);
    });

    const getPirStatusColorClass = (status: string) => {
      switch (status) {
        case "Completed":
          return "bg-success text-white";
        case "Required":
          return "bg-warning text-white";
        case "Declined":
          return "bg-danger text-white";
        default:
          return "";
      }
    };

    return {
      applications,
      dateString,
      goToViewApplication,
      getPirStatusColorClass,
    };
  },
};
</script>
