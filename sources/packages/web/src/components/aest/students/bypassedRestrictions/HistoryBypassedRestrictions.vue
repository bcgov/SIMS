<template>
  <body-header-container :enable-card-view="true">
    <template #header
      ><body-header title="History of bypassed restrictions">
        <template #actions>
          <check-permission-role :role="Role.AESTBypassStudentRestriction">
            <template #="{ notAllowed }">
              <v-btn
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
    <bypass-restriction-modal ref="bypassRestrictionModal" />
    <remove-restriction-bypass-modal ref="removeBypassModal" />
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
import { ref, defineComponent, watchEffect } from "vue";
import StatusChipBypass from "@/components/generic/StatusChipBypass.vue";
import { ApplicationRestrictionBypassService } from "@/services/ApplicationRestrictionBypassService";
import { ApplicationRestrictionBypassHistoryAPIOutDTO } from "@/services/http/dto";
import StatusChipRestriction from "@/components/generic/StatusChipRestriction.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { ModalDialog } from "@/composables";
import BypassRestrictionModal from "./BypassRestrictionModal.vue";
import RemoveRestrictionBypassModal from "./RemoveRestrictionBypassModal.vue";

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
    const removeBypassModal = ref({} as ModalDialog<boolean>);
    const bypassedRestrictions = ref({
      bypasses: [],
    } as ApplicationRestrictionBypassHistoryAPIOutDTO);

    // Adding watch effect instead of onMounted because
    // applicationId may not be not available on load.
    watchEffect(
      async () =>
        props.applicationId && (await reloadBypassedRestrictionsHistory()),
    );

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
      const result = await bypassRestrictionModal.value.showModal({
        applicationId: props.applicationId,
      });
      if (result) {
        reloadBypassedRestrictionsHistory();
      }
    };

    const openRemoveBypassModal = async (
      applicationRestrictionBypassId: number,
    ) => {
      const result = await removeBypassModal.value.showModal({
        applicationRestrictionBypassId,
      });
      if (result) {
        reloadBypassedRestrictionsHistory();
      }
    };

    const openBypassViewDetailsModal = async (
      applicationRestrictionBypassId: number,
    ) => {
      await bypassRestrictionModal.value.showModal({
        applicationRestrictionBypassId,
      });
    };

    const reloadBypassedRestrictionsHistory = async () => {
      bypassedRestrictions.value =
        await ApplicationRestrictionBypassService.shared.getApplicationRestrictionBypassesHistory(
          props.applicationId,
        );
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
      openBypassViewDetailsModal,
    };
  },
});
</script>
