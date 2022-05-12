<template>
  <v-container>
    <header-navigator
      title="All Locations"
      :routeLocation="goBackRouteParams"
      subTitle="Edit Locations"
    />
  </v-container>
  <full-page-container>
    <location-edit-form
      :locationData="initialData"
      @updateInstitutionLocation="updateInstitutionLocation"
    ></location-edit-form>
  </full-page-container>
</template>

<script lang="ts">
import { RouteLocationRaw, useRouter } from "vue-router";
import { computed, onMounted, ref } from "vue";
import { InstitutionService } from "@/services/InstitutionService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import LocationEditForm from "@/components/institutions/locations/LocationEditForm.vue";
import { InstitutionLocationEdit } from "@/types";
import { AESTInstitutionLocationAPIInDTO } from "@/services/http/dto";
import { useToastMessage } from "@/composables";
import { AuthService } from "@/services/AuthService";

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
    const initialData = ref({} as InstitutionLocationEdit);
    const toast = useToastMessage();
    const router = useRouter();
    const updateInstitutionLocation = async (
      data: AESTInstitutionLocationAPIInDTO,
    ) => {
      console.log(data);
      try {
        await InstitutionService.shared.updateInstitutionLocation(
          props.locationId,
          data,
        );
        router.push(goBackRouteParams.value);
        toast.success(
          `Your location information for ${data.locationName} have been updated`,
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
          name: AESTRoutesConst.INSTITUTION_LOCATIONS,
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
