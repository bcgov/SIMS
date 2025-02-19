<template>
  <detail-header :header-map="headerMap" />
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
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
    const { dateOnlyLongString } = useFormatters();

    const mapApplicationHeader = (
      application: ApplicationSupplementalDataAPIOutDTO,
    ): Record<string, string | undefined> => {
      return {
        Name: application.studentFullName,
        "Application number": application.applicationNumber,
        Institution: application.applicationInstitutionName,
        "Study dates": application.applicationOfferingIntensity
          ? `${dateOnlyLongString(
              application.applicationStartDate,
            )} - ${dateOnlyLongString(application.applicationEndDate)}`
          : undefined,
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
    onMounted(loadApplicationValues);

    return {
      applicationData,
      headerMap,
    };
  },
});
</script>
