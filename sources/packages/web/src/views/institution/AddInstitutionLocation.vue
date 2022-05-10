<template>
  <v-container>
    <header-navigator
      title="Manage locations"
      :routeLocation="{ name: InstitutionRoutesConst.MANAGE_LOCATIONS }"
      subTitle="Add Location"
    />
    <div class="col-md-6 offset-md-3">
      <formio formName="institutionlocation" @submitted="submitted"></formio>
    </div>
  </v-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { useToast } from "primevue/usetoast";
import formio from "../../components/generic/formio.vue";
import { InstitutionLocationFormAPIInDTO } from "@/services/http/dto";
import { InstitutionService } from "../../services/InstitutionService";
import { InstitutionRoutesConst } from "../../constants/routes/RouteConstants";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";

export default {
  components: { formio, HeaderNavigator },
  props: {
    createMode: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  setup(props: any) {
    // Hooks
    const store = useStore();
    const toast = useToast();
    const router = useRouter();
    const submitted = async (data: InstitutionLocationFormAPIInDTO) => {
      if (props.createMode) {
        try {
          await InstitutionService.shared.createInstitutionLocation(data);
          router.push({ name: InstitutionRoutesConst.MANAGE_LOCATIONS });
          store.dispatch("institution/getUserInstitutionLocationDetails");
          toast.add({
            severity: "success",
            summary: "Created!",
            detail: "Institution Location created Successfully!",
            life: 5000,
          });
        } catch (excp) {
          toast.add({
            severity: "error",
            summary: "Unexpected error",
            detail: "An error happened during the create process.",
            life: 5000,
          });
        }
      }
    };
    return {
      submitted,
      InstitutionRoutesConst,
    };
  },
};
</script>

<style></style>
