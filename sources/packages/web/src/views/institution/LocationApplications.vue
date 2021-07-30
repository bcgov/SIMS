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
                v-if="slotProps.data.pirStatus === 'completed'"
                label="COMPLETE"
                class="p-mr-2 p-mb-2 bg-success text-white"
              />
              <Chip
                v-if="slotProps.data.pirStatus === 'required'"
                label="REQUIRED"
                class="p-mr-2 p-mb-2 bg-warning text-white"
              />
            </template>
          </Column>
          <Column field="id" header="">
            <template #body="slotProps">
              <v-btn plain color="primary" outlined
                >view {{ slotProps.id }}</v-btn
              >
            </template>
          </Column>
        </DataTable>
      </v-container>
    </v-sheet>
  </v-container>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { ApplicationService } from "../../services/ApplicationService";
import { LocationsApplicationDTO } from "@/types/contracts/institution/ApplicationsDto";
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
    const applications = ref([] as LocationsApplicationDTO[]);
    const dateString = (date: string): string => {
      if (date) return new Date(date).toDateString();
      return "";
    };
    onMounted(async () => {
      applications.value = await ApplicationService.shared.getLocationApplications(
        props.locationId,
      );
    });
    return { applications, dateString };
  },
};
</script>
