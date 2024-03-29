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
import { computed, onMounted, ref, defineComponent } from "vue";
import { InstitutionService } from "@/services/InstitutionService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import LocationEditForm from "@/components/institutions/locations/LocationEditForm.vue";
import { InstitutionLocationEdit, ApiProcessError } from "@/types";
import { InstitutionLocationAPIInDTO } from "@/services/http/dto";
import { useFormioUtils, useSnackBar } from "@/composables";
import { AuthService } from "@/services/AuthService";

export default defineComponent({
  components: { LocationEditForm },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const initialData = ref({} as InstitutionLocationEdit);
    const snackBar = useSnackBar();
    const { excludeExtraneousValues } = useFormioUtils();
    const router = useRouter();
    const updateInstitutionLocation = async (data: unknown) => {
      try {
        const typedData = excludeExtraneousValues(
          InstitutionLocationAPIInDTO,
          data,
        );
        await InstitutionService.shared.updateInstitutionLocation(
          props.locationId,
          typedData,
        );
        router.push(goBackRouteParams.value);
        snackBar.success(
          `Your location information for ${typedData.locationName} have been updated`,
        );
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          snackBar.error(error.message);
        } else {
          snackBar.error("An error happened during the update process.");
        }
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
});
</script>
