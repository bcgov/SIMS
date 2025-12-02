<template>
  <tab-container>
    <body-header-container>
      <template #header>
        <body-header title="All Restrictions">
          <template #actions>
            <check-permission-role :role="Role.InstitutionAddRestriction">
              <template #="{ notAllowed }">
                <v-btn
                  @click="addInstitutionRestriction"
                  class="float-right"
                  color="primary"
                  prepend-icon="fa:fa fa-plus-circle"
                  :loading="processingAddingRestriction"
                  :disabled="notAllowed"
                  >Add restriction</v-btn
                ></template
              >
            </check-permission-role>
          </template>
        </body-header>
      </template>
      <content-group>
        <toggle-content
          :toggled="!institutionRestrictions?.length"
          message="No restrictions found."
        >
          <v-data-table
            :headers="InstitutionRestrictionsHeaders"
            :items="institutionRestrictions"
            :items-per-page="DEFAULT_PAGE_LIMIT"
            :items-per-page-options="ITEMS_PER_PAGE"
            :mobile="isMobile"
          >
            <template #[`item.restrictionCategory`]="{ item }">
              {{ item.restrictionCategory }}
            </template>
            <template #[`item.description`]="{ item }">
              {{ `${item.restrictionCode} - ${item.description}` }}
            </template>
            <template #[`item.createdAt`]="{ item }">
              {{ dateOnlyLongString(item.createdAt) }}
            </template>
            <template #[`item.updatedAt`]="{ item }">
              {{ item.isActive ? "-" : dateOnlyLongString(item.updatedAt) }}
            </template>
            <template #[`item.isActive`]="{ item }">
              <status-chip-restriction :is-active="item.isActive" />
            </template>
            <template #[`item.action`]="{ item }">
              <v-btn
                color="primary"
                variant="outlined"
                @click="viewIInstitutionRestriction(item.restrictionId)"
              >
                View
              </v-btn>
            </template>
          </v-data-table>
        </toggle-content>
      </content-group>
      <view-restriction-modal
        ref="viewRestriction"
        :restriction-data="institutionRestriction"
        @submit-resolution-data="resolveRestriction"
        :allowed-role="Role.InstitutionResolveRestriction"
      />
      <add-restriction-modal
        ref="addRestriction"
        :institution-id="institutionId"
        :entity-type="RestrictionEntityType.Institution"
        @submit-restriction-data="createNewRestriction"
        :allowed-role="Role.InstitutionAddRestriction"
      />
    </body-header-container>
  </tab-container>
</template>

<script lang="ts">
import { ref, defineComponent, watchEffect } from "vue";
import { useDisplay } from "vuetify";

import { RestrictionService } from "@/services/RestrictionService";
import ViewRestrictionModal from "@/components/common/restriction/ViewRestriction.vue";
import AddRestrictionModal from "@/components/institutions/modals/AddRestrictionModal.vue";
import { useFormatters, ModalDialog, useSnackBar } from "@/composables";
import {
  RestrictionStatus,
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  RestrictionEntityType,
  LayoutTemplates,
  Role,
  InstitutionRestrictionsHeaders,
  ApiProcessError,
} from "@/types";
import StatusChipRestriction from "@/components/generic/StatusChipRestriction.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import {
  AssignInstitutionRestrictionAPIInDTO,
  ResolveRestrictionAPIInDTO,
  RestrictionDetailAPIOutDTO,
  RestrictionSummaryAPIOutDTO,
} from "@/services/http/dto";
import { INSTITUTION_RESTRICTION_ALREADY_ACTIVE } from "@/constants";

export default defineComponent({
  components: {
    StatusChipRestriction,
    ViewRestrictionModal,
    AddRestrictionModal,
    CheckPermissionRole,
  },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const institutionRestrictions = ref([] as RestrictionSummaryAPIOutDTO[]);
    const { dateOnlyLongString } = useFormatters();
    const showModal = ref(false);
    const viewRestriction = ref({} as ModalDialog<void>);
    const addRestriction = ref(
      {} as ModalDialog<AssignInstitutionRestrictionAPIInDTO | false>,
    );
    const processingAddingRestriction = ref(false);
    const institutionRestriction = ref();
    const snackBar = useSnackBar();
    const { mobile: isMobile } = useDisplay();

    const loadInstitutionRestrictions = async () => {
      institutionRestrictions.value =
        await RestrictionService.shared.getInstitutionRestrictions(
          props.institutionId,
        );
    };

    const viewIInstitutionRestriction = async (restrictionId: number) => {
      institutionRestriction.value =
        await RestrictionService.shared.getInstitutionRestrictionDetail(
          props.institutionId,
          restrictionId,
        );
      institutionRestriction.value.createdAt = dateOnlyLongString(
        institutionRestriction.value.createdAt,
      );
      if (institutionRestriction.value.updatedAt) {
        institutionRestriction.value.updatedAt = dateOnlyLongString(
          institutionRestriction.value.updatedAt,
        );
      }

      await viewRestriction.value.showModal();
    };

    const resolveRestriction = async (data: RestrictionDetailAPIOutDTO) => {
      try {
        const payload = {
          noteDescription: data.resolutionNote,
        } as ResolveRestrictionAPIInDTO;
        await RestrictionService.shared.resolveInstitutionRestriction(
          props.institutionId,
          data.restrictionId,
          payload,
        );
        await loadInstitutionRestrictions();
        snackBar.success(
          "The given restriction has been resolved and resolution notes added.",
        );
      } catch {
        snackBar.error("Unexpected error while resolving the restriction.");
      }
    };

    /**
     * Show the modal to collect the data to create the restriction.
     */
    const addInstitutionRestriction = async () => {
      await addRestriction.value.showModal(undefined, createNewRestriction);
    };

    /**
     * Allow adding the new restriction using the modal's provided data.
     * @param modalResult Modal result. False if the user cancel the modal,
     * otherwise the validated data to be used to create the restriction.
     * @returns True if the modal should be closed, false if there was some error
     * that required the modal to remain open.
     */
    const createNewRestriction = async (
      modalResult: AssignInstitutionRestrictionAPIInDTO | false,
    ): Promise<boolean> => {
      if (modalResult === false) {
        return true;
      }
      try {
        processingAddingRestriction.value = true;
        await RestrictionService.shared.addInstitutionRestriction(
          props.institutionId,
          modalResult,
        );
        await loadInstitutionRestrictions();
        snackBar.success("Restriction was successfully added.");
        return true;
      } catch (error: unknown) {
        if (
          error instanceof ApiProcessError &&
          error.errorType === INSTITUTION_RESTRICTION_ALREADY_ACTIVE
        ) {
          snackBar.warn(
            "At least one location already has an active restriction.",
          );
        } else {
          snackBar.error("Unexpected error while adding the restriction.");
        }
        return false;
      } finally {
        processingAddingRestriction.value = false;
      }
    };

    watchEffect(loadInstitutionRestrictions);

    return {
      dateOnlyLongString,
      institutionRestrictions,
      RestrictionStatus,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      institutionRestriction,
      viewIInstitutionRestriction,
      viewRestriction,
      showModal,
      resolveRestriction,
      addRestriction,
      addInstitutionRestriction,
      createNewRestriction,
      processingAddingRestriction,
      RestrictionEntityType,
      LayoutTemplates,
      Role,
      InstitutionRestrictionsHeaders,
      isMobile,
    };
  },
});
</script>
