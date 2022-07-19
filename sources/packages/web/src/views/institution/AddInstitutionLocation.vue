<template>
  <v-container>
    <header-navigator
      title="Manage locations"
      :routeLocation="{ name: InstitutionRoutesConst.MANAGE_LOCATIONS }"
      subTitle="Add Location"
    />
    <full-page-container>
      <formio formName="institutionlocation" @submitted="submitted"></formio>
    </full-page-container>
  </v-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { InstitutionLocationFormAPIInDTO } from "@/services/http/dto";
import { InstitutionService } from "../../services/InstitutionService";
import { InstitutionRoutesConst } from "../../constants/routes/RouteConstants";
import useEmitter from "@/composables/useEmitter";
import { useToastMessage } from "@/composables";

export default {
  props: {
    createMode: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  setup(props: any) {
    const emitter = useEmitter();
    // Hooks
    const store = useStore();
    const toast = useToastMessage();
    const router = useRouter();
    const submitted = async (data: InstitutionLocationFormAPIInDTO) => {
      if (props.createMode) {
        try {
          await InstitutionService.shared.createInstitutionLocation(data);
          router.push({ name: InstitutionRoutesConst.MANAGE_LOCATIONS });
          store.dispatch("institution/getUserInstitutionLocationDetails");
          emitter.emit(
            "snackBar",
            toast.success1("Institution Location created Successfully!"),
          );
        } catch (excp) {
          emitter.emit(
            "snackBar",
            toast.error1("An error happened during the create process."),
          );
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
