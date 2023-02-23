<template>
  <v-form ref="addManualOverawardForm">
    <modal-dialog-base title="Add manual record" :showDialog="showDialog">
      <template #content>
        <error-summary :errors="addManualOverawardForm.errors" />
        <p class="label-value">
          Add a record to capture that the student paid back their loans through
          the National Student Loans Service Centre (NSLSC).
        </p>
        <v-select
          label="Award"
          density="compact"
          :items="awardTypeItems"
          v-model="formModel.awardValueCode"
          variant="outlined"
          :rules="[(v) => checkNullOrEmptyRule(v, 'Award Type')]"
        />
        <v-text-field
          hide-details="auto"
          density="compact"
          label="Add the dollar amount"
          v-model="formModel.overawardValue"
          variant="outlined"
          type="number"
          prefix="$"
          :rules="[
            (v) => checkNullOrEmptyRule(v, 'Overaward deduction amount'),
            (v) =>
              numberRangeRule(
                v,
                -MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE,
                MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE,
                'Overaward deduction amount',
              ),
          ]"
        />
      </template>
      <template #footer>
        <check-permission-role :role="allowedRole">
          <template #="{ notAllowed }">
            <footer-buttons
              primaryLabel="Add Record now"
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
import { useModalDialog, useRules } from "@/composables";
import { Role, VForm } from "@/types";
import { OverawardManualRecordAPIInDTO } from "@/services/http/dto";
import { BannerTypes } from "@/types/contracts/Banner";
import {
  FULL_TIME_AWARDS,
  PART_TIME_AWARDS,
} from "@/constants/award-constants";
import { MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE } from "@/constants/system-constants";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

export default defineComponent({
  components: { ModalDialogBase, CheckPermissionRole, ErrorSummary },
  props: {
    allowedRole: {
      type: String as PropType<Role>,
      required: true,
    },
  },
  setup() {
    const { numberRangeRule, checkNullOrEmptyRule } = useRules();
    const { showDialog, showModal, resolvePromise } = useModalDialog<
      OverawardManualRecordAPIInDTO | boolean
    >();
    const addManualOverawardForm = ref({} as VForm);
    const formModel = reactive({} as OverawardManualRecordAPIInDTO);
    const awardTypeItems = [...FULL_TIME_AWARDS, ...PART_TIME_AWARDS]
      .filter((award) => ["CSLF", "CSLP", "BCSL"].includes(award.awardType))
      .map((award) => ({
        title: `${award.awardType} (${award.description})`,
        value: award.awardType,
      }));

    const submit = async () => {
      const validationResult = await addManualOverawardForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      // Copying the payload, as reset is making the formModel properties null.
      const payload = { ...formModel };
      resolvePromise(payload);
      addManualOverawardForm.value.reset();
    };

    const cancel = () => {
      addManualOverawardForm.value.reset();
      addManualOverawardForm.value.resetValidation();
      resolvePromise(false);
    };

    return {
      showDialog,
      showModal,
      cancel,
      submit,
      addManualOverawardForm,
      formModel,
      BannerTypes,
      numberRangeRule,
      checkNullOrEmptyRule,
      awardTypeItems,
      MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE,
    };
  },
});
</script>
