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
        <toggle-content
          :toggled="!institutionRestrictions?.length"
          message="No records found."
        >
          <v-data-table
            :headers="InstitutionRestrictionsHeaders"
            :items="institutionRestrictions"
            :items-per-page="DEFAULT_PAGE_LIMIT"
            :items-per-page-options="ITEMS_PER_PAGE"
            :mobile="isMobile"
          >
            <template #loading>
              <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
            </template>
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
      <ViewRestrictionModal
        ref="viewRestriction"
        :restriction-data="institutionRestriction"
        @submit-resolution-data="resolveRestriction"
        :allowed-role="Role.InstitutionResolveRestriction"
      />
      <AddInstitutionRestrictionModal
        ref="addRestriction"
        :entity-type="RestrictionEntityType.Institution"
        @submit-restriction-data="createNewRestriction"
        :allowed-role="Role.InstitutionAddRestriction"
      />
    </body-header-container>
  </tab-container>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { useDisplay } from "vuetify";

import { RestrictionService } from "@/services/RestrictionService";
import ViewRestrictionModal from "@/components/common/restriction/ViewRestriction.vue";
import AddInstitutionRestrictionModal from "@/components/common/restriction/AddRestriction.vue";
import { useFormatters, ModalDialog, useSnackBar } from "@/composables";
import {
  RestrictionStatus,
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  RestrictionEntityType,
  LayoutTemplates,
  Role,
  InstitutionRestrictionsHeaders,
} from "@/types";
import StatusChipRestriction from "@/components/generic/StatusChipRestriction.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import {
  AssignRestrictionAPIInDTO,
  ResolveRestrictionAPIInDTO,
  RestrictionDetailAPIOutDTO,
  RestrictionSummaryAPIOutDTO,
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
    const institutionRestrictions = ref([] as RestrictionSummaryAPIOutDTO[]);
    const { dateOnlyLongString } = useFormatters();
    const showModal = ref(false);
    const viewRestriction = ref({} as ModalDialog<void>);
    const addRestriction = ref({} as ModalDialog<void>);
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
      ITEMS_PER_PAGE,
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
      InstitutionRestrictionsHeaders,
      isMobile,
    };
  },
});
</script>
