<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <content-group>
        <v-row class="m-2">
          <v-col class="category-header-medium color-blue"
            >All Restrictions</v-col
          >
          <v-col
            ><v-btn
              @click="addInstitutionRestriction"
              class="float-right primary-btn-background"
              ><font-awesome-icon :icon="['fas', 'plus']" class="mr-2" />Add
              restriction</v-btn
            ></v-col
          >
        </v-row>
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
            sortable="true"
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
              <StatusBadge
                :status="
                  slotProps.data.isActive
                    ? GeneralStatusForBadge.ActiveRestriction
                    : GeneralStatusForBadge.ResolvedRestriction
                "
              />
            </template>
          </Column>
          <!-- TODO: the color attribute has to come from either global constant or styling needs to be added to added. -->
          <Column field="restrictionId" header="">
            <template #body="slotProps">
              <v-btn
                color="#2965c5"
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
    </div>
  </v-card>
  <ViewRestrictionModal
    ref="viewRestriction"
    :restrictionData="institutionRestriction"
    @submitResolutionData="resolveRestriction"
  />
  <AddInstitutionRestrictionModal
    ref="addRestriction"
    :entityType="RestrictionEntityType.Institution"
    @submitRestrictionData="createNewRestriction"
  />
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import { RestrictionService } from "@/services/RestrictionService";
import ViewRestrictionModal from "@/components/common/restriction/ViewRestriction.vue";
import AddInstitutionRestrictionModal from "@/components/common/restriction/AddRestriction.vue";
import { useFormatters, ModalDialog, useToastMessage } from "@/composables";
import {
  GeneralStatusForBadge,
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  AssignRestrictionDTO,
  RestrictionDetailDTO,
  ResolveRestrictionDTO,
  RestrictionEntityType,
} from "@/types";
import StatusBadge from "@/components/generic/StatusBadge.vue";

export default {
  components: {
    ContentGroup,
    StatusBadge,
    ViewRestrictionModal,
    AddInstitutionRestrictionModal,
  },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const institutionRestrictions = ref();
    const { dateOnlyLongString } = useFormatters();
    const showModal = ref(false);
    const viewRestriction = ref({} as ModalDialog<void>);
    const addRestriction = ref({} as ModalDialog<void>);
    const institutionRestriction = ref();
    const toast = useToastMessage();

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

    const resolveRestriction = async (data: RestrictionDetailDTO) => {
      try {
        const payload = {
          noteDescription: data.resolutionNote,
        } as ResolveRestrictionDTO;
        await RestrictionService.shared.resolveInstitutionRestriction(
          props.institutionId,
          data.restrictionId,
          payload,
        );
        await loadInstitutionRestrictions();
        toast.success(
          "Restriction Resolved",
          "The given restriction has been resolved and resolution notes added.",
        );
      } catch (error) {
        toast.error(
          "Unexpected error",
          "Unexpected error while resolving the restriction.",
        );
      }
    };

    const addInstitutionRestriction = async () => {
      await addRestriction.value.showModal();
    };

    const createNewRestriction = async (data: AssignRestrictionDTO) => {
      try {
        await RestrictionService.shared.addInstitutionRestriction(
          props.institutionId,
          data,
        );
        await loadInstitutionRestrictions();
        toast.success(
          "Restriction Added",
          "The restriction has been added to institution.",
        );
      } catch (error) {
        toast.error(
          "Unexpected error",
          "Unexpected error while adding the restriction.",
        );
      }
    };

    onMounted(async () => {
      await loadInstitutionRestrictions();
    });
    return {
      dateOnlyLongString,
      institutionRestrictions,
      GeneralStatusForBadge,
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
    };
  },
};
</script>
