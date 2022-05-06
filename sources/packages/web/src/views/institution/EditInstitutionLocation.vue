<template>
  <div class="ml-16">
    <header-navigator
      title="Profile"
      subTitle="Edit Profile"
      :routeLocation="institutionProfileRoute"
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
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { useToast } from "primevue/usetoast";
import LocationEditForm from "@/components/institutions/locations/LocationEditForm.vue";
import { onMounted, ref } from "vue";
import {
  InstitutionLocationFormAPIInDTO,
  InstitutionLocationFormAPIOutDTO,
} from "@/services/http/dto";
import { InstitutionService } from "@/services/InstitutionService";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { ClientIdType } from "@/types";

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
    const initialData = ref({} as InstitutionLocationFormAPIOutDTO);
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
      initialData.value.clientType = ClientIdType.Institution;
    });
    return {
      initialData,
      updateInstitutionLocation,
    };
  },
};
</script>

<style></style>
