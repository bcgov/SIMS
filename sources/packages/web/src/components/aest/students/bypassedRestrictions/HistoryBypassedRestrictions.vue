<template>
  <body-header-container :enable-card-view="true">
    <template #header
      ><body-header title="History of bypassed restrictions">
        <template #actions>
          <check-permission-role :role="Role.AESTBypassStudentRestriction">
            <template #="{ notAllowed }">
              <v-btn
                v-if="true"
                class="mx-2 float-right"
                color="primary"
                :disabled="notAllowed"
                @click="openBypassRestrictionModal"
              >
                Bypass a restriction
              </v-btn>
            </template>
          </check-permission-role>
        </template>
      </body-header>
    </template>
    <content-group class="mt-4">
      <toggle-content
        :toggled="!bypassedRestrictions.bypasses.length"
        message="No bypassed restrictions found."
      >
        <v-data-table
          :headers="ApplicationRestrictionManagementHeaders"
          :items="bypassedRestrictions.bypasses"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
        >
          <template #[`item.restrictionCategory`]="{ item }">
            {{ item.restrictionCategory }}
          </template>
          <template #[`item.restrictionCode`]="{ item }">
            {{ item.restrictionCode }}
          </template>
          <template #[`item.restrictionStatus`]="{ item }">
            <status-chip-restriction
              :status="
                item.isRestrictionActive
                  ? RestrictionStatus.Active
                  : RestrictionStatus.Resolved
              "
            />
          </template>
          <template #[`item.bypassStatus`]="{ item }">
            <status-chip-bypass :is-bypass-active="item.isBypassActive" />
          </template>
          <template #[`item.id`]="{ item }">
            <v-btn
              color="primary"
              variant="text"
              class="text-decoration-underline"
              prepend-icon="fa:far fa-file-alt"
              @click="openBypassViewDetailsModal(item.id)"
            >
              View Details</v-btn
            >
          </template>
          <template #[`item.removeBypassRule`]="{ item }">
            <check-permission-role :role="Role.AESTBypassStudentRestriction">
              <template #="{ notAllowed }">
                <v-btn
                  :color="
                    getRemoveBypassColor(
                      item.isBypassActive,
                      item.isRestrictionActive,
                    )
                  "
                  :disabled="
                    !item.isBypassActive ||
                    !item.isRestrictionActive ||
                    notAllowed
                  "
                  @click="openRemoveBypassModal(item.id)"
                >
                  {{
                    getRemoveBypassLabel(
                      item.isBypassActive && item.isRestrictionActive,
                    )
                  }}</v-btn
                >
              </template>
            </check-permission-role>
          </template>
        </v-data-table>
      </toggle-content>
    </content-group>
    <bypass-restriction-modal
      ref="bypassRestrictionModal"
      :applicationId="applicationId"
      :applicationRestrictionBypassId="selectedApplicationRestrictionBypassId"
      @restrictionBypassed="reloadRestrictionBypassedHistory"
      :key="bypassRestrictionModalKey"
    />
    <remove-restriction-bypass-modal
      ref="removeBypassModal"
      :applicationRestrictionBypassId="selectedApplicationRestrictionBypassId"
      @restrictionBypassRemoved="reloadRestrictionBypassedHistory"
      :key="removeBypassModalKey"
    />
  </body-header-container>
</template>
<script lang="ts">
import {
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  ITEMS_PER_PAGE,
  ApplicationRestrictionManagementHeaders,
  RestrictionStatus,
  Role,
} from "@/types";
import { ref, onMounted, defineComponent } from "vue";
import StatusChipBypass from "@/components/generic/StatusChipBypass.vue";
import { ApplicationRestrictionBypassService } from "@/services/ApplicationRestrictionBypassService";
import { ApplicationRestrictionBypassHistoryAPIOutDTO } from "@/services/http/dto";
import StatusChipRestriction from "@/components/generic/StatusChipRestriction.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { ModalDialog } from "@/composables";
import BypassRestrictionModal from "@/components/aest/students/modals/BypassRestrictionModal.vue";
import RemoveRestrictionBypassModal from "@/components/aest/students/modals/RemoveRestrictionBypassModal.vue";

export default defineComponent({
  components: {
    StatusChipBypass,
    StatusChipRestriction,
    CheckPermissionRole,
    BypassRestrictionModal,
    RemoveRestrictionBypassModal,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const bypassRestrictionModal = ref({} as ModalDialog<boolean>);
    const bypassRestrictionModalKey = ref(0);
    const removeBypassModal = ref({} as ModalDialog<boolean>);
    const removeBypassModalKey = ref(0);
    const selectedApplicationRestrictionBypassId = ref(0);

    const bypassedRestrictions = ref({
      bypasses: [],
    } as ApplicationRestrictionBypassHistoryAPIOutDTO);
    onMounted(async () => {
      await loadBypassedRestrictionHistory();
    });

    const getRemoveBypassLabel = (isBypassActive: boolean): string => {
      return isBypassActive ? "Remove Bypass" : "Bypass Removed";
    };

    const getRemoveBypassColor = (
      isBypassActive: boolean,
      isRestrictionActive: boolean,
    ): string => {
      return !isBypassActive || !isRestrictionActive ? "secondary" : "primary";
    };

    const openBypassRestrictionModal = async () => {
      await bypassRestrictionModal.value.showModal();
    };
    const openRemoveBypassModal = async (
      applicationRestrictionBypassId: number,
    ) => {
      selectedApplicationRestrictionBypassId.value =
        applicationRestrictionBypassId;
      await removeBypassModal.value.showModal();
    };

    const openBypassViewDetailsModal = async (
      applicationRestrictionBypassId: number,
    ) => {
      selectedApplicationRestrictionBypassId.value =
        applicationRestrictionBypassId;
      await bypassRestrictionModal.value.showModal();
      selectedApplicationRestrictionBypassId.value = 0;
    };

    const loadBypassedRestrictionHistory = async () => {
      bypassedRestrictions.value =
        await ApplicationRestrictionBypassService.shared.getApplicationRestrictionBypassesHistory(
          props.applicationId,
        );
    };

    const reloadRestrictionBypassedHistory = () => {
      loadBypassedRestrictionHistory();
      bypassRestrictionModalKey.value += 1;
      removeBypassModalKey.value += 1;
      selectedApplicationRestrictionBypassId.value = 0;
    };

    return {
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      PAGINATION_LIST,
      RestrictionStatus,
      bypassedRestrictions,
      getRemoveBypassLabel,
      getRemoveBypassColor,
      ApplicationRestrictionManagementHeaders,
      Role,
      openBypassRestrictionModal,
      bypassRestrictionModal,
      openRemoveBypassModal,
      removeBypassModal,
      selectedApplicationRestrictionBypassId,
      reloadRestrictionBypassedHistory,
      bypassRestrictionModalKey,
      removeBypassModalKey,
      openBypassViewDetailsModal,
    };
  },
});
</script>
