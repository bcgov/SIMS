<template>
  <v-form ref="addManualOverawardForm">
    <modal-dialog-base :title="title" :show-dialog="showDialog">
      <template #content>
        <error-summary :errors="addManualOverawardForm.errors" />
        <p class="label-value">
          {{ description }}
        </p>
        <v-select
          label="Award"
          density="compact"
          :items="awardTypeItems"
          v-model="formModel.awardValueCode"
          variant="outlined"
          :rules="[(v) => checkNullOrEmptyRule(v, 'Award')]"
        />
        <v-text-field
          hide-details="auto"
          persistent-hint
          density="compact"
          label="Add the dollar amount"
          v-model="formModel.overawardValue"
          variant="outlined"
          type="number"
          prefix="$"
          :rules="[
            (v) => checkNullOrEmptyRule(v, 'Overaward amount'),
            (v) =>
              numberRangeRule(
                v,
                MINIMUM_AWARD_AMOUNT,
                MAXIMUM_AWARD_AMOUNT,
                'Overaward amount',
                formatCurrency,
              ),
          ]"
        />
        <v-textarea
          v-model="formModel.overawardNotes"
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
              primary-label="Add record now"
              @secondary-click="cancel"
              @primary-click="submit"
              :disable-primary-button="notAllowed"
            />
          </template>
        </check-permission-role>
      </template>
    </modal-dialog-base>
  </v-form>
</template>
<script lang="ts">
import { PropType, ref, reactive, defineComponent, computed } from "vue";
import { useModalDialog, useRules, useFormatters } from "@/composables";
import { Role, VForm } from "@/types";
import { OverawardManualRecordAPIInDTO } from "@/services/http/dto";
import { BannerTypes } from "@/types/contracts/Banner";
import {
  AWARDS,
  FullTimeAwardTypes,
  PartTimeAwardTypes,
} from "@/constants/award-constants";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

const MINIMUM_AWARD_AMOUNT = 0.01;
const MAXIMUM_AWARD_AMOUNT = 100000;

export default defineComponent({
  components: { ModalDialogBase, CheckPermissionRole, ErrorSummary },
  props: {
    allowedRole: {
      type: String as PropType<Role>,
      required: true,
    },
    isAddition: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    const { numberRangeRule, checkNullOrEmptyRule, checkNotesLengthRule } =
      useRules();
    const { formatCurrency } = useFormatters();
    const { showDialog, showModal, resolvePromise } = useModalDialog<
      OverawardManualRecordAPIInDTO | boolean
    >();
    const addManualOverawardForm = ref({} as VForm);
    const formModel = reactive({} as OverawardManualRecordAPIInDTO);
    const awardTypeItems = AWARDS.filter((award) =>
      [
        FullTimeAwardTypes.CSLF,
        PartTimeAwardTypes.CSLP,
        FullTimeAwardTypes.BCSL,
      ].includes(award.awardType),
    ).map((award) => ({
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

    const title = computed(
      () => `${props.isAddition ? "Add" : "Subtract"} overawards`,
    );
    const description = computed(() => {
      return `Add a record to capture that the student ${
        props.isAddition
          ? "owes money on their loans."
          : "paid back their loans through the National Student Loans Service Centre (NSLSC)."
      }`;
    });

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
      checkNotesLengthRule,
      formatCurrency,
      awardTypeItems,
      title,
      description,
      MINIMUM_AWARD_AMOUNT,
      MAXIMUM_AWARD_AMOUNT,
    };
  },
});
</script>
