<template>
  <div class="ml-16">
    <header-navigator
      title="All Locations"
      :routeLocation="goBackRouteParams"
      subTitle="Edit Locations"
    />
  </div>
  <full-page-container>
    <location-edit-form
      :locationData="initialData"
      @updateInstitutionLocation="updateInstitutionLocation"
    ></location-edit-form>
  </full-page-container>
</template>

<script lang="ts">
import { RouteLocationRaw, useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import { computed, onMounted, ref } from "vue";
import { InstitutionLocationFormAPIInDTO } from "@/services/http/dto";
import { InstitutionService } from "@/services/InstitutionService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import LocationEditForm from "@/components/institutions/locations/LocationEditForm.vue";
import { InstitutionLocationEdit } from "@/types";

export default {
  components: { LocationEditForm },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    // Hooks
    const initialData = ref({} as InstitutionLocationEdit);
    const toast = useToast();
    const router = useRouter();
    const updateInstitutionLocation = async (
      data: InstitutionLocationFormAPIInDTO,
    ) => {
      try {
        await InstitutionService.shared.updateInstitutionLocation(
          props.locationId,
          data,
        );
        router.push(goBackRouteParams.value);
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
          props.institutionId,
        );
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
