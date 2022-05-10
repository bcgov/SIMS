<template>
  <v-container>
    <header-navigator
      title="Manage locations"
      :routeLocation="{ name: InstitutionRoutesConst.MANAGE_LOCATIONS }"
      subTitle="Edit Location"
    />
    <full-page-container>
      <formio
        formName="institutionlocation"
        :data="initialData"
        @submitted="submitted"
      ></formio>
    </full-page-container>
  </v-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { useToast } from "primevue/usetoast";
import formio from "@/components/generic/formio.vue";
import { onMounted, ref } from "vue";
import { InstitutionLocationFormAPIInDTO } from "@/services/http/dto";
import { InstitutionService } from "@/services/InstitutionService";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";

export default {
  components: { formio, HeaderNavigator, FullPageContainer },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    // Hooks
    const store = useStore();
    const initialData = ref({});
    const toast = useToast();
    const router = useRouter();
    const submitted = async (data: InstitutionLocationFormAPIInDTO) => {
      try {
        await InstitutionService.shared.updateInstitutionLocation(
          props.locationId,
          data,
        );
        router.push({ name: InstitutionRoutesConst.MANAGE_LOCATIONS });
        store.dispatch("institution/getUserInstitutionLocationDetails");
        toast.add({
          severity: "success",
          summary: `Your location information for ${data.locationName} have been updated`,
          detail: "Location Details have been updated!",
          life: 5000,
        });
      } catch (excp) {
        toast.add({
          severity: "error",
          summary: "Unexpected error",
          detail: "An error happened during the update process.",
          life: 5000,
        });
      }
    };
    onMounted(async () => {
      initialData.value =
        await InstitutionService.shared.getInstitutionLocation(
          props.locationId,
        );
    });
    return {
      initialData,
      submitted,
      InstitutionRoutesConst,
    };
  },
};
</script>

<style></style>
