<template>
  <full-page-container :noSidebar="true">
    <template #header>
      <header-navigator
        title="Manage locations"
        :routeLocation="{ name: InstitutionRoutesConst.MANAGE_LOCATIONS }"
        subTitle="Add Location"
      />
    </template>
    <formio-container formName="institutionLocation" @submitted="submitted">
      <template #actions="{ submit }">
        <footer-buttons
          :processing="processing"
          primaryLabel="Submit"
          @primaryClick="submit"
          :showSecondaryButton="false"
        />
      </template>
    </formio-container>
  </full-page-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { InstitutionLocationFormAPIInDTO } from "@/services/http/dto";
import { InstitutionService } from "../../services/InstitutionService";
import { InstitutionRoutesConst } from "../../constants/routes/RouteConstants";

import { useSnackBar } from "@/composables";
import { ref } from "vue";
import { FormIOForm } from "@/types";

export default {
  props: {
    createMode: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  setup(props: any) {
    const processing = ref(false);
    // Hooks
    const store = useStore();
    const snackBar = useSnackBar();
    const router = useRouter();
    const submitted = async (form: FormIOForm) => {
      processing.value = true;
      if (props.createMode) {
        try {
          const data = form.data as InstitutionLocationFormAPIInDTO;
          await InstitutionService.shared.createInstitutionLocation(data);
          router.push({ name: InstitutionRoutesConst.MANAGE_LOCATIONS });
          store.dispatch("institution/getUserInstitutionLocationDetails");
          snackBar.success("Institution Location created Successfully!");
        } catch (excp) {
          snackBar.error("An error happened during the create process.");
        } finally {
          processing.value = false;
        }
      }
    };
    return {
      submitted,
      InstitutionRoutesConst,
      processing,
    };
  },
};
</script>
