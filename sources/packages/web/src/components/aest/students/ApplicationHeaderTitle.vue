<template>
  <detail-header :headerMap="headerMap" />
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import { ApplicationSupplementalDataAPIOutDTO } from "@/services/http/dto";
import { ApplicationService } from "@/services/ApplicationService";

import DetailHeader from "@/components/generic/DetailHeader.vue";

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

    const mapApplicationHeader = (
      application: ApplicationSupplementalDataAPIOutDTO,
    ): Record<string, string> => {
      if (
        application.applicationStartDate &&
        application.applicationEndDate &&
        application.applicationOfferingIntensity
      ) {
        return {
          Name: application.studentFullName,
          "Application #": application.applicationNumber,
          Institution: application.applicationInstitutionName,
          "Study dates": `${application.applicationStartDate} - ${application.applicationEndDate}`,
          Type: application.applicationOfferingIntensity,
        };
      }
      return {
        Name: application.studentFullName,
        "Application #": application.applicationNumber,
        Institution: application.applicationInstitutionName,
      };
    };

    const headerMap = ref<Record<string, string>>({});

    const loadApplicationValues = async () => {
      applicationData.value = await ApplicationService.shared.getApplication(
        props.applicationId,
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
