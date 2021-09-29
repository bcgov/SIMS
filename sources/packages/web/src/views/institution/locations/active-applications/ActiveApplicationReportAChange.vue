<template>
  <v-card class="p-m-4">
    <formio
      formName="reportachange"
      :data="initialData"
      @customEvent="customEventCallback"
    ></formio>
  </v-card>
</template>
<script lang="ts">
import { useRouter } from "vue-router";
import { ref, onMounted } from "vue";
import formio from "@/components/generic/formio.vue";
import { ConfirmationOfEnrollmentService } from "@/services/ConfirmationOfEnrollmentService";
import {
  ApplicationDetailsForCOEDTO,
  FormIOCustomEvent,
  FormIOCustomEventTypes,
} from "@/types";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";

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
    const initialData = ref({} as ApplicationDetailsForCOEDTO);
    const loadInitialData = async () => {
      initialData.value = await ConfirmationOfEnrollmentService.shared.getApplicationForCOE(
        props.applicationId,
        props.locationId,
      );
    };
    const customEventCallback = async (form: any, event: FormIOCustomEvent) => {
      if (FormIOCustomEventTypes.RouteToInstitutionActiveSummaryPage === event.type) {
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
