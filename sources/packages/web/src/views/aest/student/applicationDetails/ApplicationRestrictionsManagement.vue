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
      <p>
        <span class="label-bold-normal">Application #: </span>
        <span
          >{{ emptyStringFiller(applicationDetail.applicationNumber) }} |
        </span>
        <span class="label-bold-normal">Institution: </span>
        <span>{{ applicationDetail.data.selectedLocationName }} | </span>
        <span class="label-bold-normal">Study Dates: </span>
        <span
          >{{ dateOnlyLongString(applicationDetail.data.selectedOfferingDate) }}
          -
          {{
            dateOnlyLongString(applicationDetail.data.selectedOfferingEndDate)
          }}
          |
        </span>
        <span class="label-bold-normal">Type: </span>
        <span
          >{{
            getOfferingIntensity(
              applicationDetail.data.howWillYouBeAttendingTheProgram,
            )
          }}
        </span>
      </p>
    </template>
    <history-bypassed-restrictions
      class="mb-5"
      :applicationId="applicationId"
      :key="historyKey"
    />
    <div class="text-center my-3 muted-content">
      <span class="header-text-small">Date submitted: </span
      ><span class="value-text-small">Date</span>
    </div>
  </full-page-container>
</template>

<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { defineComponent, onMounted, ref } from "vue";
import HistoryBypassedRestrictions from "@/components/aest/students/bypassedRestrictions/HistoryBypassedRestrictions.vue";
import { ApplicationService } from "@/services/ApplicationService";
import { ApplicationBaseAPIOutDTO } from "@/services/http/dto";
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
    const applicationDetail = ref({
      applicationNumber: "-",
      data: {
        selectedLocationName: "",
        selectedOfferingDate: "",
        selectedOfferingEndDate: "",
        howWillYouBeAttendingTheProgram: "",
      },
    } as ApplicationBaseAPIOutDTO);

    onMounted(async () => {
      applicationDetail.value =
        await ApplicationService.shared.getApplicationDetail(
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
