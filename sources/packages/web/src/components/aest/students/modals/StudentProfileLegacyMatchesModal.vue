<template>
  <v-form ref="linkProfileForm">
    <modal-dialog-base :showDialog="showDialog" title="Confirm profile link"
      ><template #content>
        <error-summary :errors="linkProfileForm.errors" />
        <p>Add a note and confirm the legacy profile link.</p>
        <strong>This action cannot be undone.</strong>
        <v-textarea
          v-model="noteDescription"
          variant="outlined"
          label="Note"
          :rules="[checkNotesLengthRule]"
          required
          :min-width="isMobile ? undefined : 600"
          class="mt-4"
          hide-details="auto"
        ></v-textarea>
      </template>
      <template #footer>
        <footer-buttons
          primaryLabel="Link profile"
          @primaryClick="linkProfile"
          @secondaryClick="cancel"
          :processing="loading"
        />
      </template>
    </modal-dialog-base>
  </v-form>
</template>
<script lang="ts">
import { ref, defineComponent } from "vue";
import { useModalDialog, useRules } from "@/composables";
import { VForm } from "@/types";
import { LegacyStudentMatchesAPIInDTO } from "@/services/http/dto";
import { useDisplay } from "vuetify/lib/framework.mjs";

export default defineComponent({
  setup() {
    const {
      showDialog,
      resolvePromise,
      showModal,
      loading,
      hideModal,
      showParameter,
    } = useModalDialog<LegacyStudentMatchesAPIInDTO | false>();
    const { mobile: isMobile } = useDisplay();
    const { checkNotesLengthRule } = useRules();
    const noteDescription = ref("");
    const linkProfileForm = ref({} as VForm);

    const linkProfile = async () => {
      const validationResult = await linkProfileForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      const payload = {
        individualId: showParameter.value,
        noteDescription: noteDescription.value,
      };
      await resolvePromise(payload);
      linkProfileForm.value.reset();
    };

    const cancel = () => {
      linkProfileForm.value.reset();
      resolvePromise(false);
      hideModal();
    };

    return {
      noteDescription,
      linkProfileForm,
      showDialog,
      showModal,
      loading,
      checkNotesLengthRule,
      linkProfile,
      cancel,
      isMobile,
    };
  },
});
</script>
