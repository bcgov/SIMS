<template>
  <header-navigator
    title="Report a change"
    :routeLocation="{
      name: InstitutionRoutesConst.ACTIVE_APPLICATIONS_SUMMARY,
      params: {
        locationId: locationId,
      },
    }"
    subTitle="View Application"
  />
  <full-page-container class="p-m-4">
    <formio
      formName="reportscholasticstandingchange"
      :data="initialData"
      @submitted="submit"
      @customEvent="customEventCallback"
    ></formio>
  </full-page-container>
</template>
<script lang="ts">
import { useRouter } from "vue-router";
import { ref, onMounted } from "vue";
import formio from "@/components/generic/formio.vue";
import { InstitutionService } from "@/services/InstitutionService";
import { FormIOCustomEvent, FormIOCustomEventTypes } from "@/types";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import { ActiveApplicationDataAPIOutDTO } from "@/services/http/dto";
import { ScholasticStandingAPIInDTO } from "@/services/http/dto/ScholasticStanding.dto";

export default {
  components: {
    formio,
    HeaderNavigator,
    FullPageContainer,
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
          },
        });
      }
    };

    onMounted(async () => {
      await loadInitialData();
    });

    const submit = async (data: ScholasticStandingAPIInDTO) => {
      await InstitutionService.shared.saveScholasticStanding(
        props.applicationId,
        props.locationId,
        data,
      );
    };

    return {
      initialData,
      customEventCallback,
      InstitutionRoutesConst,
      submit,
    };
  },
};
</script>
