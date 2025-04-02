<template>
  <detail-header :header-map="headerMap" />
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect } from "vue";
import { ApplicationSupplementalDataAPIOutDTO } from "@/services/http/dto";
import { ApplicationService } from "@/services/ApplicationService";
import DetailHeader from "@/components/generic/DetailHeader.vue";
import { useFormatters } from "@/composables";

export default defineComponent({
  components: { DetailHeader },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const applicationData = ref<ApplicationSupplementalDataAPIOutDTO>();
    const headerMap = ref<Record<string, string | undefined>>({});
    const { dateOnlyLongPeriodString } = useFormatters();

    const mapApplicationHeader = (
      application: ApplicationSupplementalDataAPIOutDTO,
    ): Record<string, string | undefined> => {
      return {
        Name: application.studentFullName,
        "Application number": application.applicationNumber,
        Institution: application.applicationInstitutionName,
        "Study dates": dateOnlyLongPeriodString(
          application.applicationStartDate,
          application.applicationEndDate,
        ),
        Type: application.applicationOfferingIntensity,
      };
    };

    const loadApplicationValues = async () => {
      applicationData.value = await ApplicationService.shared.getApplication(
        props.applicationId,
        { loadDynamicData: false },
      );

      headerMap.value = mapApplicationHeader(applicationData.value);
    };
    // Adding watch effect instead of onMounted because
    // applicationId may not be not available on load.
    watchEffect(
      async () => props.applicationId && (await loadApplicationValues()),
    );

    return {
      applicationData,
      headerMap,
    };
  },
});
</script>
