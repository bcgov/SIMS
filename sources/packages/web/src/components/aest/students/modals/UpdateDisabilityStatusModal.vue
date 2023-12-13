<template>
  <v-form ref="updateDisabilityStatusForm">
    <modal-dialog-base
      title="Update disability status"
      :showDialog="showDialog"
    >
      <template #content>
        <error-summary :errors="updateDisabilityStatusForm.errors" />
        <p class="label-value">
          Update the disability status of student and add note.
        </p>
        <v-select
          hide-details="auto"
          label="Disability Status"
          density="compact"
          :items="disabilityStatusSelectItems"
          v-model="formModel.disabilityStatus"
          variant="outlined"
          :rules="[(v) => checkNullOrEmptyRule(v, 'Disability Status')]"
        />
        <v-textarea
          v-model="formModel.noteDescription"
          variant="outlined"
          label="Note"
          :rules="[checkNotesLengthRule]"
          required
          class="mt-4"
          hide-details="auto"
        ></v-textarea>
      </template>
      <template #footer>
        <check-permission-role :role="allowedRole">
          <template #="{ notAllowed }">
            <footer-buttons
              primaryLabel="Update"
              :processing="loading"
              @secondaryClick="cancel"
              @primaryClick="submit"
              :disablePrimaryButton="notAllowed"
            />
          </template>
        </check-permission-role>
      </template>
    </modal-dialog-base>
  </v-form>
</template>
<script lang="ts">
import { PropType, ref, reactive, defineComponent } from "vue";
import { useModalDialog, useRules, useFormatters } from "@/composables";
import { Role, VForm, SelectItemType, DisabilityStatus } from "@/types";
import { UpdateDisabilityStatusAPIInDTO } from "@/services/http/dto";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

export default defineComponent({
  components: { CheckPermissionRole },
  props: {
    allowedRole: {
      type: String as PropType<Role>,
      required: true,
    },
  },
  setup() {
    const { checkNullOrEmptyRule, checkNotesLengthRule } = useRules();
    const { disabilityStatusToDisplay } = useFormatters();
    const { showDialog, showModal, resolvePromise, hideModal, loading } =
      useModalDialog<UpdateDisabilityStatusAPIInDTO | boolean>();
    const updateDisabilityStatusForm = ref({} as VForm);
    const formModel = reactive({} as UpdateDisabilityStatusAPIInDTO);
    const disabilityStatusSelectItems = Object.keys(
      DisabilityStatus,
    ).map<SelectItemType>((key) => ({
      title: disabilityStatusToDisplay(DisabilityStatus[key]),
      value: DisabilityStatus[key],
    }));

    const submit = async () => {
      const validationResult =
        await updateDisabilityStatusForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      // Copying the payload, as reset is making the formModel properties null.
      const payload = { ...formModel };
      resolvePromise(payload, { keepModalOpen: true });
      updateDisabilityStatusForm.value.reset();
    };

    const cancel = () => {
      updateDisabilityStatusForm.value.reset();
      updateDisabilityStatusForm.value.resetValidation();
      resolvePromise(false);
    };

    return {
      showDialog,
      showModal,
      hideModal,
      loading,
      cancel,
      submit,
      updateDisabilityStatusForm,
      formModel,
      checkNullOrEmptyRule,
      checkNotesLengthRule,
      disabilityStatusSelectItems,
    };
  },
});
</script>
