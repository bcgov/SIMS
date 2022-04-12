<template>
  <v-card class="p-m-4">
    <formio
      formName="reportscholasticstandingchange"
      :data="initialData"
      @customEvent="customEventCallback"
    ></formio>
  </v-card>
</template>
<script lang="ts">
import { useRouter } from "vue-router";
import { ref, onMounted } from "vue";
import formio from "@/components/generic/formio.vue";
import { InstitutionService } from "@/services/InstitutionService";
import { FormIOCustomEvent, FormIOCustomEventTypes } from "@/types";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { ActiveApplicationDataAPIOutDTO } from "@/services/http/dto";

export default {
  components: {
    formio,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const initialData = ref({} as ActiveApplicationDataAPIOutDTO);
    const loadInitialData = async () => {
      initialData.value = await InstitutionService.shared.getActiveApplication(
        props.applicationId,
        props.locationId,
      );
    };
    const customEventCallback = async (form: any, event: FormIOCustomEvent) => {
      if (
        FormIOCustomEventTypes.RouteToInstitutionActiveSummaryPage ===
        event.type
      ) {
        router.push({
          name: InstitutionRoutesConst.ACTIVE_APPLICATIONS_SUMMARY,
          params: {
            locationId: props.locationId,
            locationName: initialData.value?.applicationLocationName,
          },
        });
      }
    };
    onMounted(async () => {
      await loadInitialData();
    });
    return {
      initialData,
      customEventCallback,
    };
  },
};
</script>
