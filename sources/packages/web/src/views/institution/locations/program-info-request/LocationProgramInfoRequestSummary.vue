<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        :title="locationName"
        subTitle="Program Information Requests"
        data-cy="programInformationRequestsHeader"
      />
    </template>
    <body-header
      title="Active applications"
      title-header-level="2"
      data-cy="activeApplicationsTab"
      :recordsCount="applications.length"
    />
    <content-group>
      <toggle-content :toggled="!applications.length">
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
                {{ dateOnlyLongString(slotProps.data.studyStartPeriod) }} -
                {{ dateOnlyLongString(slotProps.data.studyEndPeriod) }}
              </span>
            </template></Column
          >
          <Column field="applicationNumber" header="Application #"></Column>
          <Column field="pirStatus" header="Status">
            <template #body="slotProps">
              <status-chip-program-info-request
                :status="slotProps.data.pirStatus"
              />
            </template>
          </Column>
          <Column field="applicationId" header="">
            <template #body="slotProps">
              <v-btn
                color="primary"
                @click="goToViewApplication(slotProps.data.applicationId)"
                >View</v-btn
              >
            </template>
          </Column>
        </DataTable>
      </toggle-content>
    </content-group>
  </full-page-container>
</template>

<script lang="ts">
import { onMounted, ref, watch, computed, defineComponent } from "vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { ProgramInfoRequestService } from "@/services/ProgramInfoRequestService";
import { useFormatters, useInstitutionState } from "@/composables";
import StatusChipProgramInfoRequest from "@/components/generic/StatusChipProgramInfoRequest.vue";
import { PIRSummaryAPIOutDTO } from "@/services/http/dto";

export default defineComponent({
  components: { StatusChipProgramInfoRequest },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const { getLocationName } = useInstitutionState();
    const router = useRouter();
    const { dateOnlyLongString } = useFormatters();
    const applications = ref([] as PIRSummaryAPIOutDTO[]);

    const locationName = computed(() => {
      return getLocationName(props.locationId);
    });

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

    return {
      applications,
      dateOnlyLongString,
      goToViewApplication,
      locationName,
    };
  },
});
</script>
