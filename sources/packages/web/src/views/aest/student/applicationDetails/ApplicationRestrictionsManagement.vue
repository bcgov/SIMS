<template>
  <full-page-container layout-template="centered">
    <template #header>
      <header-navigator
        title="Student Applications"
        :routeLocation="{
          name: AESTRoutesConst.STUDENT_APPLICATIONS,
          params: { studentId },
        }"
        subTitle="Application Restriction Management"
      />
      <div v-if="applicationDetail.applicationNumber">
        <span class="label-bold-normal">Application #: </span>
        <span
          >{{ emptyStringFiller(applicationDetail.applicationNumber) }} |
        </span>
        <span class="label-bold-normal">Institution: </span>
        <span>{{ applicationDetail.applicationInstitutionName }} | </span>
        <span class="label-bold-normal">Study Dates: </span>
        <span
          >{{ dateOnlyLongString(applicationDetail.applicationStartDate) }}
          -
          {{ dateOnlyLongString(applicationDetail.applicationEndDate) }}
          |
        </span>
        <span class="label-bold-normal">Type: </span>
        <span
          >{{
            getOfferingIntensity(applicationDetail.applicationOfferingIntensity)
          }}
        </span>
      </div>
    </template>
    <history-bypassed-restrictions
      class="mb-5"
      :applicationId="applicationId"
      :applicationStatus="applicationDetail.applicationStatus"
      :key="historyKey"
    />
    <div class="text-center mt-6">
      <span class="header-text-small">Date submitted: </span
      ><span class="value-text-small">{{
        dateOnlyLongString(applicationDetail.submittedDate)
      }}</span>
    </div>
  </full-page-container>
</template>

<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { defineComponent, onMounted, ref } from "vue";
import HistoryBypassedRestrictions from "@/components/aest/students/bypassedRestrictions/HistoryBypassedRestrictions.vue";
import { ApplicationService } from "@/services/ApplicationService";
import { ApplicationHeaderAPIOutDTO } from "@/services/http/dto";
import { useFormatters } from "@/composables";

export default defineComponent({
  components: {
    HistoryBypassedRestrictions,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const { dateOnlyLongString, emptyStringFiller } = useFormatters();
    const historyKey = ref(0);
    const applicationDetail = ref({} as ApplicationHeaderAPIOutDTO);

    onMounted(async () => {
      applicationDetail.value =
        await ApplicationService.shared.getApplicationHeaderInformation(
          props.applicationId,
        );
    });

    const getOfferingIntensity = (offeringIntensity: string) => {
      return offeringIntensity === "Full Time" ? "Full-time" : "Part-time";
    };

    const reloadHistory = () => {
      // Changing component's key makes it to re-render/reload.
      historyKey.value++;
    };

    return {
      AESTRoutesConst,
      applicationDetail,
      dateOnlyLongString,
      emptyStringFiller,
      historyKey,
      getOfferingIntensity,
      reloadHistory,
    };
  },
});
</script>
