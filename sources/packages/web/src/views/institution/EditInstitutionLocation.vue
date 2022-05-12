<template>
  <v-container>
    <header-navigator
      title="All Locations"
      :routeLocation="goBackRouteParams"
      subTitle="Edit Locations"
    />
    <full-page-container>
      <location-edit-form
        :locationData="initialData"
        @updateInstitutionLocation="updateInstitutionLocation"
      ></location-edit-form>
    </full-page-container>
  </v-container>
</template>

<script lang="ts">
import { RouteLocationRaw, useRouter } from "vue-router";
import { useStore } from "vuex";
import LocationEditForm from "@/components/institutions/locations/LocationEditForm.vue";
import { computed, onMounted, ref } from "vue";
import { InstitutionLocationPrimaryContactAPIInDTO } from "@/services/http/dto";
import { InstitutionService } from "@/services/InstitutionService";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { AuthService } from "@/services/AuthService";
import { InstitutionLocationEdit } from "@/types";
import { useToastMessage } from "@/composables";

export default {
  components: { LocationEditForm },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    // Hooks
    const store = useStore();
    const initialData = ref({} as InstitutionLocationEdit);
    const toast = useToastMessage();
    const router = useRouter();
    const updateInstitutionLocation = async (
      data: InstitutionLocationPrimaryContactAPIInDTO,
    ) => {
      try {
        await InstitutionService.shared.updateInstitutionLocation(
          props.locationId,
          data,
        );
        router.push(goBackRouteParams.value);
        store.dispatch("institution/getUserInstitutionLocationDetails");
        toast.success(
          "Your location information have been updated",
          "Location Details have been updated!",
        );
      } catch (excp) {
        toast.error(
          "Unexpected error",
          "An error happened during the update process.",
        );
      }
    };
    onMounted(async () => {
      initialData.value =
        await InstitutionService.shared.getInstitutionLocation(
          props.locationId,
        );
      initialData.value.clientType = AuthService.shared.authClientType;
    });
    const goBackRouteParams = computed(
      () =>
        ({
          name: InstitutionRoutesConst.MANAGE_LOCATIONS,
          params: {
            locationId: props.locationId,
          },
        } as RouteLocationRaw),
    );
    return {
      initialData,
      updateInstitutionLocation,
      goBackRouteParams,
    };
  },
};
</script>

<style></style>
