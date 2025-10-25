<template>
  <v-form ref="updateModifiedIndependentStatusForm">
    <modal-dialog-base
      :show-dialog="showDialog"
      title="Update modified independent status"
    >
      <template #content>
        <error-summary :errors="updateModifiedIndependentStatusForm.errors" />
        <p class="label-value my-2">
          Update the modified independent status of student and add note.
        </p>
        <v-select
          class="my-2"
          hide-details="auto"
          label="Modified independent status"
          density="compact"
          :items="modifiedIndependentStatusSelectItems"
          v-model="formModel.modifiedIndependentStatus"
          variant="outlined"
          :rules="[
            (v) => checkNullOrEmptyRule(v, 'Modified independent status'),
          ]"
        />
        <v-textarea
          class="my-4"
          label="Note"
          variant="outlined"
          hide-details="auto"
          v-model="formModel.noteDescription"
          :rules="[checkNotesLengthRule]"
          required
        />
      </template>
      <template #footer>
        <footer-buttons
          :processing="loading"
          primary-label="Update"
          @secondary-click="cancel"
          @primary-click="updateModifiedIndependentStatus"
        />
      </template>
    </modal-dialog-base>
  </v-form>
</template>
<script lang="ts">
import { ModifiedIndependentStatus, SelectItemType, VForm } from "@/types";
import { ref, defineComponent, reactive } from "vue";
import { useRules, useModalDialog, useFormatters } from "@/composables";
import { UpdateModifiedIndependentStatusAPIInDTO } from "@/services/http/dto";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";

export default defineComponent({
  components: {
    ModalDialogBase,
    ErrorSummary,
  },
  setup() {
    const { showDialog, showModal, resolvePromise, loading } = useModalDialog<
      UpdateModifiedIndependentStatusAPIInDTO | false
    >();
    const updateModifiedIndependentStatusForm = ref({} as VForm);
    const { checkNotesLengthRule, checkNullOrEmptyRule } = useRules();
    const { modifiedIndependentStatusToDisplay } = useFormatters();
    const formModel = reactive({} as UpdateModifiedIndependentStatusAPIInDTO);
    const modifiedIndependentStatusSelectItems = Object.values(
      ModifiedIndependentStatus,
    ).map<SelectItemType>((value) => ({
      title: modifiedIndependentStatusToDisplay(value),
      value: value,
    }));
    const cancel = () => {
      updateModifiedIndependentStatusForm.value.reset();
      resolvePromise(false);
    };
    const updateModifiedIndependentStatus = async () => {
      const validationResult =
        await updateModifiedIndependentStatusForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      const response = await resolvePromise({ ...formModel });
      if (response) {
        updateModifiedIndependentStatusForm.value.reset();
      }
    };
    return {
      showDialog,
      showModal,
      loading,
      updateModifiedIndependentStatusForm,
      updateModifiedIndependentStatus,
      cancel,
      checkNotesLengthRule,
      checkNullOrEmptyRule,
      formModel,
      modifiedIndependentStatusSelectItems,
    };
  },
});
</script>
