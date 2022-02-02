<template>
  <v-row class="m-2">
    <v-col class="category-header-medium color-blue">{{ header }}</v-col>
  </v-row>
  <div class="mx-5 py-4">
    <content-group>
      <DataTable
        :autoLayout="true"
        :value="applications"
        class="p-m-4"
        :paginator="true"
        :rows="10"
      >
        <template #empty>
          <p class="text-center font-weight-bold">No records found.</p>
        </template>
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
        <Column field="disbursementDate" header="Disbursement Date">
          <template #body="slotProps">
            <span>
              {{ dateString(slotProps.data.disbursementDate) }}
            </span>
          </template></Column
        >
        <Column field="coeStatus" header="Status">
          <template #body="slotProps">
            <COEStatusBadge :status="slotProps.data.coeStatus" />
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
    </content-group>
  </div>
</template>

<script lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { ConfirmationOfEnrollmentService } from "@/services/ConfirmationOfEnrollmentService";
import { COESummaryDTO } from "@/types";
import { useFormatters } from "@/composables";
import COEStatusBadge from "@/components/generic/COEStatusBadge.vue";
import ContentGroup from "@/components/generic/ContentGroup.vue";

export default {
  components: { COEStatusBadge, ContentGroup },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    header: {
      type: String,
      required: true,
    },
    enrollmentPeriod: {
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
        props.enrollmentPeriod,
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

    return {
      applications,
      dateString,
      goToViewApplication,
    };
  },
};
</script>
