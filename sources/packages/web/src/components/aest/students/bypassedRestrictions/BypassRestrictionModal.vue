<template>
  <v-form ref="bypassRestrictionForm">
    <modal-dialog-base :show-dialog="showDialog" title="Bypass restriction">
      <template #content>
        <h3 class="category-header-medium secondary-color my-4">
          Bypass information
        </h3>
        <error-summary :errors="bypassRestrictionForm.errors" />
        <content-group>
          <banner
            class="mb-2"
            :type="BannerTypes.Warning"
            header="No active restrictions available to be bypassed or all active restrictions already have an active bypass."
            v-if="!readOnly && restrictionsToBypass.length === 0"
          />
          <v-select
            label="I want this application to bypass the following restriction"
            density="compact"
            :items="restrictionsToBypass"
            item-title="restrictionCode"
            item-value="restrictionId"
            v-model="formModel.restrictionId"
            variant="outlined"
            :rules="[(v) => checkNullOrEmptyRule(v, 'Restriction')]"
            :disabled="readOnly"
            hide-details="auto"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props" title="">
                <title-with-chip
                  :title="item.title"
                  :restricted-party="item.raw.restrictedParty"
                />
              </v-list-item>
            </template>
            <template #selection="{ item }">
              <v-list-item title="">
                <title-with-chip
                  :title="item.title"
                  :restricted-party="item.raw.restrictedParty"
                />
              </v-list-item>
            </template>
          </v-select>
          <v-radio-group
            label="Until"
            inline
            v-model="formModel.bypassBehavior"
            color="primary"
            class="mt-2"
            :rules="[(v) => checkNullOrEmptyRule(v, 'Until')]"
            :disabled="readOnly"
          >
            <v-radio
              label="The next scheduled disbursement has been issued. Note: If the application is reassessed, the next disbursement will be ignored."
              :value="RestrictionBypassBehaviors.NextDisbursementOnly"
              color="primary"
            ></v-radio>
            <v-radio
              label="All disbursements associated with this application have been issued."
              :value="RestrictionBypassBehaviors.AllDisbursements"
              color="primary"
            ></v-radio>
          </v-radio-group>
          <v-textarea
            label="Notes"
            variant="outlined"
            hide-details="auto"
            v-model="formModel.note"
            :rules="[checkNotesLengthRule]"
            required
            v-if="!readOnly"
          />
          <title-value
            property-title="Notes"
            :property-value="formModel.note"
            v-if="readOnly"
          />
          <v-row v-if="restrictionBypassDetails.createdDate" class="mt-2">
            <v-col>
              <title-value
                property-title="Date created"
                :property-value="
                  dateOnlyLongString(restrictionBypassDetails.createdDate)
                "
              />
            </v-col>
            <v-col>
              <title-value
                property-title="Created by"
                :property-value="restrictionBypassDetails.createdBy"
              /> </v-col
          ></v-row>
        </content-group>
        <template v-if="restrictionBypassDetails?.removedDate">
          <v-divider-opaque class="mt-6" />
          <h3 class="category-header-medium secondary-color mb-6">
            Bypass removal information
          </h3>
          <content-group>
            <title-value
              property-title="Notes"
              :property-value="restrictionBypassDetails.removalNote"
            />
            <v-row class="mt-2">
              <v-col>
                <title-value
                  property-title="Removal"
                  :property-value="
                    dateOnlyLongString(restrictionBypassDetails.removedDate)
                  "
                />
              </v-col>
              <v-col>
                <title-value
                  property-title="Removed by"
                  :property-value="restrictionBypassDetails.removedBy"
                />
              </v-col>
            </v-row>
          </content-group>
        </template>
      </template>
      <template #footer>
        <footer-buttons
          :processing="loading"
          primary-label="Bypass restriction"
          @secondary-click="cancel"
          @primary-click="bypassRestriction"
          :show-primary-button="
            !restrictionBypassDetails?.applicationRestrictionBypassId
          "
        />
      </template>
    </modal-dialog-base>
  </v-form>
</template>
<script lang="ts">
import {
  ApiProcessError,
  BannerTypes,
  RestrictedParty,
  RestrictionBypassBehaviors,
  RestrictionBypassItem,
  VForm,
} from "@/types";
import { ref, defineComponent } from "vue";
import {
  useRules,
  useModalDialog,
  useFormatters,
  useSnackBar,
} from "@/composables";
import {
  ApplicationRestrictionBypassAPIOutDTO,
  AvailableRestrictionsAPIOutDTO,
  BypassRestrictionAPIInDTO,
} from "@/services/http/dto";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { ApplicationRestrictionBypassService } from "@/services/ApplicationRestrictionBypassService";
import TitleWithChip from "@/components/generic/TitleWithChip.vue";

export default defineComponent({
  components: {
    ModalDialogBase,
    TitleWithChip,
  },
  setup() {
    const snackBar = useSnackBar();
    const { dateOnlyLongString } = useFormatters();
    const applicationId = ref(0);
    const readOnly = ref(false);
    const restrictionsToBypass = ref([] as RestrictionBypassItem[]);
    const restrictionBypassDetails = ref(
      {} as ApplicationRestrictionBypassAPIOutDTO,
    );
    const formModel = ref({} as BypassRestrictionAPIInDTO);
    const availableRestrictionsToBypass = ref(
      {} as AvailableRestrictionsAPIOutDTO,
    );
    const {
      showDialog,
      showModal: showModalInternal,
      resolvePromise,
      loading,
    } = useModalDialog<boolean>();
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
        const foundRestriction =
          availableRestrictionsToBypass.value.availableRestrictionsToBypass?.find(
            (r) => r.restrictionId === formModel.value.restrictionId,
          );
        await ApplicationRestrictionBypassService.shared.bypassRestriction({
          applicationId: applicationId.value,
          restrictionId: formModel.value.restrictionId,
          bypassBehavior: formModel.value.bypassBehavior,
          note: formModel.value.note,
          restrictedParty: foundRestriction!.restrictedParty,
        });
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
      restrictionId: number,
      restrictedParty: RestrictedParty,
    ): RestrictionBypassItem => {
      const formattedDate = dateOnlyLongString(createdDate);
      return {
        restrictionCode: `${restrictionCode} added on ${formattedDate}`,
        restrictionId,
        restrictedParty,
      };
    };

    const showModal = async (params: {
      applicationId?: number;
      applicationRestrictionBypassId?: number;
    }) => {
      formModel.value = {} as BypassRestrictionAPIInDTO;
      if (params.applicationId) {
        readOnly.value = false;
        applicationId.value = params.applicationId;
        availableRestrictionsToBypass.value =
          await ApplicationRestrictionBypassService.shared.getAvailableRestrictionsToBypass(
            applicationId.value,
          );
        if (!availableRestrictionsToBypass.value.availableRestrictionsToBypass)
          return;
        restrictionsToBypass.value =
          availableRestrictionsToBypass.value.availableRestrictionsToBypass.map(
            (restriction) => {
              return getRestrictionToBypassOption(
                restriction.restrictionCode,
                restriction.restrictionCreatedAt,
                restriction.restrictionId,
                restriction.restrictedParty,
              );
            },
          );
      } else if (params.applicationRestrictionBypassId) {
        readOnly.value = true;
        restrictionBypassDetails.value =
          await ApplicationRestrictionBypassService.shared.getApplicationRestrictionBypass(
            params.applicationRestrictionBypassId,
          );
        restrictionsToBypass.value = [
          getRestrictionToBypassOption(
            restrictionBypassDetails.value.restrictionCode,
            restrictionBypassDetails.value.createdDate,
            restrictionBypassDetails.value.restrictionId,
            restrictionBypassDetails.value.restrictedParty,
          ),
        ];
        formModel.value.restrictionId =
          restrictionBypassDetails.value.restrictionId;
        formModel.value.bypassBehavior = restrictionBypassDetails.value
          .bypassBehavior as RestrictionBypassBehaviors;
        formModel.value.note = restrictionBypassDetails.value.creationNote;
      }
      return showModalInternal();
    };

    return {
      showDialog,
      showModal,
      loading,
      bypassRestrictionForm,
      bypassRestriction,
      cancel,
      checkNotesLengthRule,
      note,
      availableRestrictionsToBypass,
      formModel,
      checkNullOrEmptyRule,
      restrictionsToBypass,
      restrictionBypassDetails,
      dateOnlyLongString,
      BannerTypes,
      readOnly,
      RestrictionBypassBehaviors,
    };
  },
});
</script>
