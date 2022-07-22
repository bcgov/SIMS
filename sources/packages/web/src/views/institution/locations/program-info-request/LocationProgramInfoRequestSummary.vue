<template>
  <div class="p-m-4">
    <header-navigator
      :title="locationName"
      subTitle="Program Information Requests"
    />

    <v-container>
      <v-sheet elevation="1" class="mx-auto mt-2">
        <v-container>
          <DataTable
            :autoLayout="true"
            :value="applications"
            class="p-m-4"
            :paginator="true"
            :rows="10"
          >
            <Column field="fullName" header="Name">
              <template #body="slotProps">
                <span>{{ slotProps.data.fullName }}</span>
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
            <Column field="applicationId" header="">
              <template #body="slotProps">
                <v-btn
                  color="primary"
                  variant="outlined"
                  @click="goToViewApplication(slotProps.data.applicationId)"
                  >view</v-btn
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
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { ProgramInfoRequestService } from "@/services/ProgramInfoRequestService";
import { PIRSummaryDTO, ProgramInfoStatus } from "@/types";
import { useFormatters } from "@/composables";

export default {
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
      async (currValue) => {
        //update the list
        await updateSummaryList(currValue);
      },
    );

    onMounted(async () => {
      await updateSummaryList(props.locationId);
    });

    const getPirStatusColorClass = (status: string) => {
      switch (status) {
        case ProgramInfoStatus.submitted:
          return "bg-info text-white";
        case ProgramInfoStatus.completed:
          return "bg-success text-white";
        case ProgramInfoStatus.required:
          return "bg-warning text-white";
        case ProgramInfoStatus.declined:
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
