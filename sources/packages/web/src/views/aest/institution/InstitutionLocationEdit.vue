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
import { computed, onMounted, ref } from "vue";
import { InstitutionService } from "@/services/InstitutionService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import LocationEditForm from "@/components/institutions/locations/LocationEditForm.vue";
import { InstitutionLocationEdit } from "@/types";
import { InstitutionLocationAPIInDTO } from "@/services/http/dto";
import { useToastMessage } from "@/composables";
import { AuthService } from "@/services/AuthService";
import useEmitter from "@/composables/useEmitter";

export default {
  components: { LocationEditForm },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const emitter = useEmitter();
    const initialData = ref({} as InstitutionLocationEdit);
    const toast = useToastMessage();
    const router = useRouter();
    const updateInstitutionLocation = async (
      data: InstitutionLocationAPIInDTO,
    ) => {
      try {
        await InstitutionService.shared.updateInstitutionLocation(
          props.locationId,
          data,
        );
        router.push(goBackRouteParams.value);
        emitter.emit(
          "snackBar",
          toast.success1(
            `Your location information for ${data.locationName} have been updated`,
          ),
        );
      } catch (excp) {
        emitter.emit(
          "snackBar",
          toast.error1("An error happened during the update process."),
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
