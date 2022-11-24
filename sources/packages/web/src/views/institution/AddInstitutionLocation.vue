<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Manage locations"
        :routeLocation="{ name: InstitutionRoutesConst.MANAGE_LOCATIONS }"
        subTitle="Add Location"
        data-cy="manageLocationHeader"
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
import { FormIOForm, ApiProcessError } from "@/types";
import { DUPLICATE_INSTITUTION_LOCATION_CODE } from "@/constants";

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
    const submitted = async (
      form: FormIOForm<InstitutionLocationFormAPIInDTO>,
    ) => {
      processing.value = true;
      if (props.createMode) {
        try {
          await InstitutionService.shared.createInstitutionLocation(form.data);
          router.push({ name: InstitutionRoutesConst.MANAGE_LOCATIONS });
          store.dispatch("institution/getUserInstitutionLocationDetails");
          snackBar.success("Institution Location created Successfully!");
        } catch (excp) {
          if (excp instanceof ApiProcessError) {
            snackBar.error(excp.message);
          } else {
            snackBar.error("An error happened during the create process.");
          }
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
