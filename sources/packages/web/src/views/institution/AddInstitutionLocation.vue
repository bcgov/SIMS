<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Manage locations"
        :routeLocation="{ name: InstitutionRoutesConst.MANAGE_LOCATIONS }"
        subTitle="Add Location"
        data-cy="addLocationHeader"
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

import { useFormioUtils, useSnackBar } from "@/composables";
import { ref, defineComponent } from "vue";
import { FormIOForm, ApiProcessError } from "@/types";

export default defineComponent({
  props: {
    createMode: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  setup(props) {
    const processing = ref(false);
    // Hooks
    const store = useStore();
    const snackBar = useSnackBar();
    const { excludeExtraneousValues } = useFormioUtils();
    const router = useRouter();
    const submitted = async (form: FormIOForm<unknown>) => {
      processing.value = true;
      if (props.createMode) {
        try {
          const typedData = excludeExtraneousValues(
            InstitutionLocationFormAPIInDTO,
            form.data,
          );
          await InstitutionService.shared.createInstitutionLocation(typedData);
          router.push({ name: InstitutionRoutesConst.MANAGE_LOCATIONS });
          store.dispatch("institution/getUserInstitutionLocationDetails");
          snackBar.success("Institution Location created Successfully!");
        } catch (error: unknown) {
          if (error instanceof ApiProcessError) {
            snackBar.error(error.message);
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
});
</script>
