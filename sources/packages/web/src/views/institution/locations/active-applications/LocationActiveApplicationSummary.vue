<template>
  <div class="p-m-4">
    <HeaderNavigator :title="locationName" subTitle="Report a Change" />

    <TabView lazy class="mt-4">
      <TabPanel>
        <template #header>
          <span class="ml-2">Available to report</span>
        </template>
        <!-- <COESummaryData
          :locationId="locationId"
          :enrollmentPeriod="EnrollmentPeriod.Current"
          header="Available to report"
          subTitle="Confirm enrolment so that funding can be dispersed."
        /> -->
      </TabPanel>
      <TabPanel>
        <template #header>
          <span class="ml-2">Unavailable to report</span>
        </template>
        <!-- <COESummaryData
          :locationId="locationId"
          :enrollmentPeriod="EnrollmentPeriod.Upcoming"
          header="Upcoming enrollment"
          subTitle="These applications are still outside of the 21 days of the study start date."
        /> -->
      </TabPanel>
    </TabView>
    <!-- <v-container>
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
            <Column field="applicationStatus" header="Status">
              <template #body="slotProps">
                <Chip
                  :label="slotProps.data.applicationStatus"
                  class="p-mr-2 p-mb-2 text-uppercase"
                  :class="
                    getApplicationStatusColorClass(
                      slotProps.data.applicationStatus,
                    )
                  "
                />
              </template>
            </Column>
            <Column field="applicationId" header="">
              <template #body="slotProps">
                <v-btn
                  color="primary"
                  variant="outlined"
                  @click="goToApplicationView(slotProps.data.applicationId)"
                  >Report a Change</v-btn
                >
              </template>
            </Column>
          </DataTable>
        </v-container>
      </v-sheet>
    </v-container> -->
  </div>
</template>

<script lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { InstitutionService } from "@/services/InstitutionService";
import { ApplicationStatus } from "@/types";
import { ActiveApplicationSummaryAPIOutDTO } from "@/services/http/dto";
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
    const applications = ref([] as ActiveApplicationSummaryAPIOutDTO[]);

    const goToApplicationView = (applicationId: number) => {
      router.push({
        name: InstitutionRoutesConst.ACTIVE_APPLICATION_EDIT,
        params: { locationId: props.locationId, applicationId },
      });
    };

    const updateSummaryList = async (locationId: number) => {
      applications.value =
        await InstitutionService.shared.getActiveApplicationsSummary(
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

    const getApplicationStatusColorClass = (status: string) => {
      if (ApplicationStatus.completed === status) {
        return "bg-success text-white";
      }
    };

    return {
      applications,
      dateString,
      goToApplicationView,
      getApplicationStatusColorClass,
    };
  },
};
</script>
