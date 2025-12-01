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
        <DataTable
          :value="institutionRestrictions"
          :paginator="true"
          :rows="DEFAULT_PAGE_LIMIT"
          :rows-per-page-options="PAGINATION_LIST"
        >
          <template #empty>
            <p class="text-center font-weight-bold">No records found.</p>
          </template>
          <Column
            field="restrictionCategory"
            header="Category"
            :sortable="true"
          ></Column>
          <Column field="description" header="Reason">
            <template #body="slotProps">{{
              `${slotProps.data.restrictionCode} - ${slotProps.data.description}`
            }}</template></Column
          >
          <Column field="createdAt" header="Added"
            ><template #body="slotProps">{{
              dateOnlyLongString(slotProps.data.createdAt)
            }}</template></Column
          >
          <Column field="updatedAt" header="Resolved">
            <template #body="slotProps">{{
              slotProps.data.isActive
                ? "-"
                : dateOnlyLongString(slotProps.data.updatedAt)
            }}</template></Column
          >
          <Column field="isActive" header="Status">
            <template #body="slotProps">
              <status-chip-restriction :is-active="slotProps.data.isActive" />
            </template>
          </Column>
          <Column field="restrictionId" header="">
            <template #body="slotProps">
              <v-btn
                color="primary"
                variant="outlined"
                @click="
                  viewIInstitutionRestriction(slotProps.data.restrictionId)
                "
                >View</v-btn
              >
            </template></Column
          >
        </DataTable>
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
import { RestrictionService } from "@/services/RestrictionService";
import ViewRestrictionModal from "@/components/common/restriction/ViewRestriction.vue";
import AddRestrictionModal from "@/components/institutions/modals/AddRestrictionModal.vue";
import { useFormatters, ModalDialog, useSnackBar } from "@/composables";
import {
  RestrictionStatus,
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  RestrictionEntityType,
  LayoutTemplates,
  Role,
  ApiProcessError,
} from "@/types";
import StatusChipRestriction from "@/components/generic/StatusChipRestriction.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import {
  AssignInstitutionRestrictionAPIInDTO,
  ResolveRestrictionAPIInDTO,
  RestrictionDetailAPIOutDTO,
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
    const institutionRestrictions = ref();
    const { dateOnlyLongString } = useFormatters();
    const showModal = ref(false);
    const viewRestriction = ref({} as ModalDialog<void>);
    const addRestriction = ref(
      {} as ModalDialog<AssignInstitutionRestrictionAPIInDTO | false>,
    );
    const processingAddingRestriction = ref(false);
    const institutionRestriction = ref();
    const snackBar = useSnackBar();

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
          snackBar.warn("An active restriction is already present.");
        }
        snackBar.error("Unexpected error while adding the restriction.");
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
      PAGINATION_LIST,
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
    };
  },
});
</script>
