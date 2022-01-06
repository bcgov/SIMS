<template>
  <v-container>
    <p class="text-muted font-weight-bold h3">{{ locationName }}</p>
    <p class="font-weight-bold h2">Confirmation Of Enrollment</p>
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
          <Column field="coeStatus" header="Status">
            <template #body="slotProps">
              <Chip
                :label="slotProps.data.coeStatus"
                class="p-mr-2 p-mb-2 text-uppercase"
                :class="getCOEStatusColorClass(slotProps.data.coeStatus)"
              />
            </template>
          </Column>
          <Column field="applicationId" header="">
            <template #body="slotProps">
              <v-btn
                plain
                color="primary"
                outlined
                @click="goToViewApplication(slotProps.data.applicationId)"
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
import { ConfirmationOfEnrollmentService } from "@/services/ConfirmationOfEnrollmentService";
import { COESummaryDTO, COEStatus } from "@/types";
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
    const applications = ref([] as COESummaryDTO[]);

    const goToViewApplication = (applicationId: number) => {
      router.push({
        name: InstitutionRoutesConst.COE_EDIT,
        params: { locationId: props.locationId, applicationId },
      });
    };

    const updateSummaryList = async (locationId: number) => {
      applications.value = await ConfirmationOfEnrollmentService.shared.getCOESummary(
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

    const getCOEStatusColorClass = (status: string) => {
      switch (status) {
        case COEStatus.completed:
          return "bg-success text-white";
        case COEStatus.required:
          return "bg-warning text-white";
        case COEStatus.declined:
          return "bg-danger text-white";
        default:
          return "";
      }
    };

    return {
      applications,
      dateString,
      goToViewApplication,
      getCOEStatusColorClass,
    };
  },
};
</script>
