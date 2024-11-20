<template>
  <v-form ref="bypassRestrictionForm">
    <modal-dialog-base :showDialog="showDialog" title="Bypass restriction">
      >
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
            v-model="formModel.studentRestrictionId"
            variant="outlined"
            :rules="[(v) => checkNullOrEmptyRule(v, 'Restriction')]"
            :disabled="readOnly"
            hide-details="auto"
          />
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
            propertyTitle="Notes"
            :propertyValue="formModel.note"
            v-if="readOnly"
          />
          <v-row v-if="restrictionBypassDetails.createdDate" class="mt-2">
            <v-col>
              <title-value
                propertyTitle="Date created"
                :propertyValue="
                  dateOnlyLongString(restrictionBypassDetails.createdDate)
                "
              />
            </v-col>
            <v-col>
              <title-value
                propertyTitle="Created by"
                :propertyValue="restrictionBypassDetails.createdBy"
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
              propertyTitle="Notes"
              :propertyValue="restrictionBypassDetails.removalNote"
            />
            <v-row class="mt-2">
              <v-col>
                <title-value
                  propertyTitle="Removal"
                  :propertyValue="
                    dateOnlyLongString(restrictionBypassDetails.removedDate)
                  "
                />
              </v-col>
              <v-col>
                <title-value
                  propertyTitle="Removed by"
                  :propertyValue="restrictionBypassDetails.removedBy"
                />
              </v-col>
            </v-row>
          </content-group>
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
import {
  ApiProcessError,
  BannerTypes,
  RestrictionBypassBehaviors,
  SelectItemType,
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
  AvailableStudentRestrictionsAPIOutDTO,
  BypassRestrictionAPIInDTO,
} from "@/services/http/dto";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { ApplicationRestrictionBypassService } from "@/services/ApplicationRestrictionBypassService";

export default defineComponent({
  components: {
    ModalDialogBase,
  },
  setup() {
    const snackBar = useSnackBar();
    const { dateOnlyLongString } = useFormatters();
    const applicationId = ref(0);
    const readOnly = ref(false);
    const restrictionsToBypass = ref([] as SelectItemType[]);
    const restrictionBypassDetails = ref(
      {} as ApplicationRestrictionBypassAPIOutDTO,
    );
    const formModel = ref({} as BypassRestrictionAPIInDTO);
    const availableStudentRestrictions = ref(
      {} as AvailableStudentRestrictionsAPIOutDTO,
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
        await ApplicationRestrictionBypassService.shared.bypassRestriction({
          applicationId: applicationId.value,
          studentRestrictionId: formModel.value.studentRestrictionId,
          bypassBehavior: formModel.value.bypassBehavior,
          note: formModel.value.note,
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
      studentRestrictionId: number,
    ) => {
      const formattedDate = dateOnlyLongString(createdDate);
      return {
        title: `${restrictionCode} added on ${formattedDate}`,
        value: studentRestrictionId,
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
        availableStudentRestrictions.value =
          await ApplicationRestrictionBypassService.shared.getAvailableStudentRestrictions(
            applicationId.value,
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
            restrictionBypassDetails.value.studentRestrictionId,
          ),
        ];
        formModel.value.studentRestrictionId =
          restrictionBypassDetails.value.studentRestrictionId;
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
      availableStudentRestrictions,
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
