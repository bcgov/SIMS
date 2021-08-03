<template>
  <v-container>
    <p class="text-muted font-weight-bold h3">{{ locationName }}</p>
    <p class="font-weight-bold h2">Student Applications</p>
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
                :class="
                  slotProps.data.pirStatus === 'completed'
                    ? 'bg-success text-white'
                    : slotProps.data.pirStatus === 'required'
                    ? 'bg-warning text-white'
                    : ''
                "
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
import { ApplicationService } from "../../services/ApplicationService";
import { PIRSummaryDTO } from "@/types/contracts/institution/ApplicationsDto";
import DataTable from "primevue/datatable";
import Column from "primevue/column";

export default {
  components: {
    DataTable,
    Column,
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
    const applications = ref([] as PIRSummaryDTO[]);
    const dateString = (date: string): string => {
      if (date) return new Date(date).toDateString();
      return "";
    };
    const goToViewApplication = (applicationId: number) => {
      console.log(applicationId);
    };
    const updateSummaryList = async (locationId: number) => {
      applications.value = await ApplicationService.shared.getPIRSummary(
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
    return { applications, dateString, goToViewApplication };
  },
};
</script>
