<template>
  <v-form ref="bypassRestrictionForm">
    <modal-dialog-base :showDialog="showDialog" title="Bypass restriction">
      >
      <template #content>
        <h3 class="category-header-medium my-4">Bypass information</h3>
        <error-summary :errors="bypassRestrictionForm.errors" />
        <v-card class="pa-4 border">
          <v-alert
            variant="outlined"
            icon="fa:fa fa-triangle-exclamation"
            class="sims-banner v-alert text-warning my-3"
            v-if="
              !applicationRestrictionBypassId &&
              restrictionsToBypass.length === 0
            "
          >
            No active restrictions available to be bypassed or all active
            restrictions already have an active bypass.
          </v-alert>
          <span class="label-bold"
            >I want this application to bypass the following restriction:</span
          >
          <v-select
            density="compact"
            :items="restrictionsToBypass"
            v-model="formModel.studentRestrictionId"
            variant="outlined"
            :rules="[(v) => checkNullOrEmptyRule(v, 'Restriction')]"
            :disabled="!!applicationRestrictionBypassId"
          />
          <span class="label-bold">Until</span>
          <v-radio-group
            inline
            v-model="formModel.bypassBehavior"
            color="primary"
            class="mt-2"
            :rules="[(v) => checkNullOrEmptyRule(v, 'Until')]"
            :disabled="!!applicationRestrictionBypassId"
          >
            <v-radio
              label="The next scheduled disbursement has been issued. Note: If the application is reassessed, the next disbursement will be ignored."
              value="Next disbursement only"
              color="primary"
            ></v-radio>
            <v-radio
              label="All disbursements associated with this application have been issued."
              value="All disbursements"
              color="primary"
            ></v-radio>
          </v-radio-group>
          <span class="label-bold">Notes</span>
          <v-textarea
            label="Notes"
            variant="outlined"
            hide-details="auto"
            v-model="formModel.note"
            :rules="[checkNotesLengthRule]"
            required
            v-if="!applicationRestrictionBypassId"
          />
          <template v-if="restrictionBypassDetails.createdDate">
            <p class="pt-1 brand-gray-text">
              {{ restrictionBypassDetails.creationNote }}
            </p>
            <v-row>
              <v-col class="mt-2">
                <div class="label-bold">Removal:</div>
                {{ dateOnlyLongString(restrictionBypassDetails.createdDate) }}
              </v-col>
              <v-col class="mt-2">
                <div class="label-bold">Removed by:</div>
                {{ restrictionBypassDetails.createdBy }}
              </v-col>
            </v-row>
          </template>
        </v-card>
        <template v-if="restrictionBypassDetails?.removedDate">
          <v-divider-opaque class="mt-6" />
          <h3 class="category-header-medium mb-4 mb-6">
            Bypass removal information
          </h3>
          <v-card class="pa-4 border">
            <span class="label-bold">Notes</span>
            <p class="pt-1 brand-gray-text">
              {{ restrictionBypassDetails.removalNote }}
            </p>
            <v-row>
              <v-col class="mt-2">
                <div class="label-bold">Removal:</div>
                {{ dateOnlyLongString(restrictionBypassDetails.removedDate) }}
              </v-col>
              <v-col class="mt-2">
                <div class="label-bold">Removed by:</div>
                {{ restrictionBypassDetails.removedBy }}
              </v-col>
            </v-row>
          </v-card>
        </template>
      </template>
      <template #footer>
        <footer-buttons
          :processing="loading"
          primaryLabel="Bypass restriction"
          @secondaryClick="cancel"
          @primaryClick="bypassRestriction"
          :showPrimaryButton="
            !restrictionBypassDetails?.applicationRestrictionBypassId
          "
        />
      </template>
    </modal-dialog-base>
  </v-form>
</template>
<script lang="ts">
import { ApiProcessError, SelectItemType, VForm } from "@/types";
import { ref, defineComponent, reactive, watchEffect, watch } from "vue";
import {
  useRules,
  useModalDialog,
  useFormatters,
  useSnackBar,
} from "@/composables";
import {
  ApplicationRestrictionBypassAPIOutDTO,
  AvailableStudentRestrictionsAPIOutDTO,
  BypassRestrictionAPIInDTO,
  RestrictionBypassBehaviors,
} from "@/services/http/dto";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { ApplicationRestrictionBypassService } from "@/services/ApplicationRestrictionBypassService";

export default defineComponent({
  components: {
    ModalDialogBase,
  },
  emits: { restrictionBypassed: null },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
    applicationRestrictionBypassId: {
      type: Number,
      required: false,
    },
  },
  setup(props, { emit }) {
    const snackBar = useSnackBar();
    const { dateOnlyLongString } = useFormatters();
    const restrictionsToBypass = ref([] as SelectItemType[]);
    const restrictionBypassDetails = ref(
      {} as ApplicationRestrictionBypassAPIOutDTO,
    );
    const formModel = reactive({} as BypassRestrictionAPIInDTO);
    const availableStudentRestrictions = ref(
      {} as AvailableStudentRestrictionsAPIOutDTO,
    );
    const { showDialog, showModal, resolvePromise, loading } =
      useModalDialog<boolean>();
    const bypassRestrictionForm = ref({} as VForm);
    const { checkNullOrEmptyRule, checkNotesLengthRule } = useRules();
    const note = ref("");
    const cancel = () => {
      restrictionBypassDetails.value =
        {} as ApplicationRestrictionBypassAPIOutDTO;
      bypassRestrictionForm.value.reset();
      resolvePromise(false);
    };
    const bypassRestriction = async () => {
      const validationResult = await bypassRestrictionForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      try {
        loading.value = true;
        await ApplicationRestrictionBypassService.shared.bypassRestriction({
          applicationId: props.applicationId,
          studentRestrictionId: formModel.studentRestrictionId,
          bypassBehavior: formModel.bypassBehavior,
          note: formModel.note,
        });
        emit("restrictionBypassed");
        snackBar.success("Restriction bypassed.");
        resolvePromise(true);
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          snackBar.warn(error.message);
        } else {
          snackBar.error(
            "An unexpected error happen while bypassing the restriction.",
          );
        }
      } finally {
        loading.value = false;
      }
    };

    const getRestrictionToBypassOption = (
      restrictionCode: string,
      createdDate: Date,
      studentRestrictionId: number,
    ) => {
      const formattedDate = dateOnlyLongString(createdDate);
      return {
        title: `${restrictionCode} added on ${formattedDate}`,
        value: studentRestrictionId,
      };
    };

    watchEffect(async () => {
      availableStudentRestrictions.value =
        await ApplicationRestrictionBypassService.shared.getAvailableStudentRestrictions(
          props.applicationId,
        );
      if (!availableStudentRestrictions.value.availableRestrictionsToBypass)
        return;
      restrictionsToBypass.value =
        availableStudentRestrictions.value.availableRestrictionsToBypass.map(
          (restriction) => {
            return getRestrictionToBypassOption(
              restriction.restrictionCode,
              restriction.studentRestrictionCreatedAt,
              restriction.studentRestrictionId,
            );
          },
        );
    });

    watch(
      () => props.applicationRestrictionBypassId,
      async (applicationRestrictionBypassId) => {
        if (applicationRestrictionBypassId) {
          restrictionBypassDetails.value =
            await ApplicationRestrictionBypassService.shared.getApplicationRestrictionBypass(
              applicationRestrictionBypassId,
            );
          restrictionsToBypass.value = [
            getRestrictionToBypassOption(
              restrictionBypassDetails.value.restrictionCode,
              restrictionBypassDetails.value.createdDate,
              restrictionBypassDetails.value.studentRestrictionId,
            ),
          ];
          formModel.studentRestrictionId =
            restrictionBypassDetails.value.studentRestrictionId;
          formModel.bypassBehavior = restrictionBypassDetails.value
            .bypassBehavior as RestrictionBypassBehaviors;
        }
      },
      { immediate: true },
    );

    return {
      showDialog,
      showModal,
      loading,
      bypassRestrictionForm,
      bypassRestriction,
      cancel,
      checkNotesLengthRule,
      note,
      availableStudentRestrictions,
      formModel,
      checkNullOrEmptyRule,
      restrictionsToBypass,
      restrictionBypassDetails,
      dateOnlyLongString,
    };
  },
});
</script>
