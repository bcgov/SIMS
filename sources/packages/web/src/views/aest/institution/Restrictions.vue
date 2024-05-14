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
          :rowsPerPageOptions="PAGINATION_LIST"
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
              <status-chip-restriction
                :status="
                  slotProps.data.isActive
                    ? RestrictionStatus.Active
                    : RestrictionStatus.Resolved
                "
              />
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
      <ViewRestrictionModal
        ref="viewRestriction"
        :restrictionData="institutionRestriction"
        @submitResolutionData="resolveRestriction"
        :allowedRole="Role.InstitutionResolveRestriction"
      />
      <AddInstitutionRestrictionModal
        ref="addRestriction"
        :entityType="RestrictionEntityType.Institution"
        @submitRestrictionData="createNewRestriction"
        :allowedRole="Role.InstitutionAddRestriction"
      />
    </body-header-container>
  </tab-container>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { RestrictionService } from "@/services/RestrictionService";
import ViewRestrictionModal from "@/components/common/restriction/ViewRestriction.vue";
import AddInstitutionRestrictionModal from "@/components/common/restriction/AddRestriction.vue";
import { useFormatters, ModalDialog, useSnackBar } from "@/composables";
import {
  RestrictionStatus,
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  RestrictionEntityType,
  LayoutTemplates,
  Role,
} from "@/types";
import StatusChipRestriction from "@/components/generic/StatusChipRestriction.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import {
  AssignRestrictionAPIInDTO,
  ResolveRestrictionAPIInDTO,
  RestrictionDetailAPIOutDTO,
} from "@/services/http/dto";

export default defineComponent({
  components: {
    StatusChipRestriction,
    ViewRestrictionModal,
    AddInstitutionRestrictionModal,
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
    const addRestriction = ref({} as ModalDialog<void>);
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

    const addInstitutionRestriction = async () => {
      await addRestriction.value.showModal();
    };

    const createNewRestriction = async (data: AssignRestrictionAPIInDTO) => {
      try {
        await RestrictionService.shared.addInstitutionRestriction(
          props.institutionId,
          data,
        );
        await loadInstitutionRestrictions();
        snackBar.success("The restriction has been added to institution.");
      } catch {
        snackBar.error("Unexpected error while adding the restriction.");
      }
    };

    onMounted(async () => {
      await loadInstitutionRestrictions();
    });
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
      RestrictionEntityType,
      LayoutTemplates,
      Role,
    };
  },
});
</script>
