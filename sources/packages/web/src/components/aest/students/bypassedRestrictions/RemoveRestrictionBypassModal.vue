<template>
  <v-form ref="removeRestrictionBypassForm">
    <modal-dialog-base :showDialog="showDialog" title="Remove bypass">
      <template #content>
        <h3 class="category-header-medium my-4">Are you sure?</h3>
        <error-summary :errors="removeRestrictionBypassForm.errors" />
        <content-group>
          Removing the bypass will result in the restriction being fully active
          on their account, possibly resulting in funding being blocked.
          <v-textarea
            label="Notes"
            variant="outlined"
            hide-details="auto"
            v-model="formModel.note"
            class="mt-4"
            :rules="[checkNotesLengthRule]"
            required
          />
        </content-group>
      </template>
      <template #footer>
        <footer-buttons
          :processing="loading"
          primaryLabel="Remove bypass"
          @secondaryClick="cancel"
          @primaryClick="removeBypass"
        />
      </template>
    </modal-dialog-base>
  </v-form>
</template>
<script lang="ts">
import { ApiProcessError, VForm } from "@/types";
import { ref, defineComponent, reactive } from "vue";
import { useRules, useModalDialog, useSnackBar } from "@/composables";
import { RemoveBypassRestrictionAPIInDTO } from "@/services/http/dto";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { ApplicationRestrictionBypassService } from "@/services/ApplicationRestrictionBypassService";

export default defineComponent({
  components: {
    ModalDialogBase,
  },
  setup() {
    const snackBar = useSnackBar();
    const formModel = reactive({} as RemoveBypassRestrictionAPIInDTO);
    const applicationRestrictionBypassId = ref(0);
    const {
      showDialog,
      showModal: showModalInternal,
      resolvePromise,
      loading,
    } = useModalDialog<boolean>();
    const removeRestrictionBypassForm = ref({} as VForm);
    const { checkNotesLengthRule } = useRules();
    const note = ref("");
    const cancel = () => {
      removeRestrictionBypassForm.value.reset();
      resolvePromise(false);
    };
    const removeBypass = async () => {
      const validationResult =
        await removeRestrictionBypassForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      try {
        loading.value = true;
        await ApplicationRestrictionBypassService.shared.removeBypass(
          applicationRestrictionBypassId.value,
          {
            note: formModel.note,
          },
        );
        snackBar.success("Bypass removed.");
        resolvePromise(true);
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          snackBar.warn(error.message);
        } else {
          snackBar.error(
            "An unexpected error happen while removing the bypass for the restriction.",
          );
        }
      } finally {
        loading.value = false;
      }
    };
    const showModal = async (params: {
      applicationRestrictionBypassId: number;
    }) => {
      applicationRestrictionBypassId.value =
        params.applicationRestrictionBypassId;
      formModel.note = "";
      return showModalInternal();
    };
    return {
      showDialog,
      showModal,
      loading,
      removeRestrictionBypassForm,
      removeBypass,
      cancel,
      checkNotesLengthRule,
      note,
      formModel,
    };
  },
});
</script>
