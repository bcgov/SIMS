<template>
  <full-page-container
    :full-width="true"
    :layout-template="LayoutTemplates.Centered"
  >
    <template #header
      ><header-navigator
        title="Corporate Accounting Services"
        subTitle="Invoices"
      />
    </template>
    <body-header-container :enableCardView="true">
      <template #header>
        <body-header
          title="Accounts payable invoicing"
          subTitle="Please see below the list of invoices batches."
          :recordsCount="paginatedBatches.count"
        >
          <template #actions>
            <v-btn-toggle
              mandatory
              v-model="approvalStatusFilter"
              class="float-right btn-toggle"
              selected-class="selected-btn-toggle"
              @update:model-value="filterByApprovalStatus"
            >
              <v-btn
                rounded="xl"
                color="primary"
                :value="ApprovalStatusFilter.All"
                class="mr-2"
                >All statuses</v-btn
              >
              <v-btn
                v-for="approvalStatus in CASInvoiceBatchApprovalStatus"
                :key="approvalStatus"
                rounded="xl"
                color="primary"
                :value="approvalStatus"
                class="mr-2"
                >{{ approvalStatus }}</v-btn
              >
            </v-btn-toggle>
          </template>
        </body-header>
      </template>
      <content-group>
        <toggle-content
          :toggled="!paginatedBatches.count && !invoiceBatchesLoading"
        >
          <v-data-table-server
            :headers="CASInvoicesBatchesHeaders"
            :items="paginatedBatches.results"
            :items-length="paginatedBatches.count"
            :items-per-page="DEFAULT_PAGE_LIMIT"
            :items-per-page-options="ITEMS_PER_PAGE"
            :loading="invoiceBatchesLoading"
            @update:options="pageSortEvent"
          >
            <template #[`item.batchDate`]="{ item }">
              {{ getISODateHourMinuteString(item.batchDate) }}
            </template>
            <template #[`item.batchName`]="{ item }">
              {{ item.batchName }}
            </template>
            <template #[`item.approvalStatus`]="{ item }">
              <status-invoice-batch-approval :status="item.approvalStatus" />
            </template>
            <template #[`item.approvalStatusAudit`]="{ item }">
              {{ item.approvalStatusUpdatedBy }} on
              {{ dateOnlyLongString(item.approvalStatusUpdatedOn) }}
            </template>
            <template #[`item.actions`]="{ item }">
              <check-permission-role :role="Role.AESTCASInvoicing">
                <template #="{ notAllowed }">
                  <v-btn
                    :disabled="notAllowed || !!item.downloadInProgress"
                    @click="downloadBatch(item)"
                    variant="text"
                    color="primary"
                    text="Download"
                  >
                    <span class="text-decoration-underline"
                      ><strong>Download</strong></span
                    >
                  </v-btn>
                </template>
              </check-permission-role>
              <check-permission-role :role="Role.AESTCASExpenseAuthority">
                <template #="{ notAllowed }">
                  <v-btn
                    :disabled="
                      notAllowed ||
                      item.approvalStatus !==
                        CASInvoiceBatchApprovalStatus.Pending ||
                      !!item.approvalInProgress
                    "
                    variant="text"
                    color="primary"
                    @click="approveBatch(item)"
                  >
                    <span class="text-decoration-underline"
                      ><strong>Approve</strong></span
                    >
                  </v-btn>
                  <v-btn
                    :disabled="
                      notAllowed ||
                      item.approvalStatus !==
                        CASInvoiceBatchApprovalStatus.Pending ||
                      !!item.approvalInProgress
                    "
                    variant="text"
                    color="primary"
                    @click="rejectBatch(item)"
                  >
                    <span class="text-decoration-underline"
                      ><strong>Reject</strong></span
                    >
                  </v-btn>
                </template>
              </check-permission-role>
            </template>
          </v-data-table-server>
        </toggle-content>
      </content-group>
    </body-header-container>
    <c-a-s-manual-intervention />
  </full-page-container>
  <confirm-modal
    title="Approve invoice batch"
    ref="approveBatchModal"
    okLabel="Approve batch"
    cancelLabel="Cancel"
    text="Are you sure you want to confirm the approval of the batch?"
  />
  <confirm-modal
    title="Reject invoice batch"
    ref="rejectBatchModal"
    okLabel="Reject batch"
    cancelLabel="Cancel"
    text="Are you sure you want to confirm the rejection of the batch?"
  />
</template>

<script lang="ts">
import { ModalDialog, useFormatters, useSnackBar } from "@/composables";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { CASInvoiceBatchService } from "@/services/CASInvoiceBatchService";
import {
  CASInvoiceBatchAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import {
  CASInvoiceBatchApprovalStatus,
  CASInvoicesBatchesHeaders,
  DataTableOptions,
  DataTableSortOrder,
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  PaginationOptions,
  Role,
  LayoutTemplates,
} from "@/types";
import { defineComponent, onMounted, ref } from "vue";
import StatusInvoiceBatchApproval from "@/components/generic/StatusInvoiceBatchApproval.vue";
import ConfirmModal from "@/components/common/modals/ConfirmModal.vue";
import CASManualIntervention from "@/components/aest/CASManualIntervention.vue";

const DEFAULT_SORT_FIELD = "batchDate";
const ApprovalStatusFilter = {
  All: "All",
  ...CASInvoiceBatchApprovalStatus,
};

interface CASInvoiceBatchModel extends CASInvoiceBatchAPIOutDTO {
  downloadInProgress?: boolean;
  approvalInProgress?: boolean;
}

export default defineComponent({
  components: {
    CheckPermissionRole,
    StatusInvoiceBatchApproval,
    ConfirmModal,
    CASManualIntervention,
  },
  setup() {
    const snackBar = useSnackBar();
    const { dateOnlyLongString, getISODateHourMinuteString } = useFormatters();
    const approveBatchModal = ref({} as ModalDialog<boolean>);
    const rejectBatchModal = ref({} as ModalDialog<boolean>);
    const invoiceBatchesLoading = ref(false);
    /**
     * Pagination with batch invoices and the total available.
     */
    const paginatedBatches = ref(
      {} as PaginatedResultsAPIOutDTO<CASInvoiceBatchModel>,
    );
    const approvalStatusFilter = ref([ApprovalStatusFilter.All]);
    /**
     * Current state of the pagination.
     */
    const currentPagination: PaginationOptions = {
      page: 1,
      pageLimit: DEFAULT_PAGE_LIMIT,
      sortField: DEFAULT_SORT_FIELD,
      sortOrder: DataTableSortOrder.DESC,
    };

    onMounted(async () => {
      await loadInvoiceBatches();
    });

    const loadInvoiceBatches = async () => {
      try {
        invoiceBatchesLoading.value = true;
        paginatedBatches.value =
          await CASInvoiceBatchService.shared.getInvoiceBatches({
            ...currentPagination,
          });
      } catch (error: unknown) {
        snackBar.error("Unexpected error while loading CAS invoices.");
      } finally {
        invoiceBatchesLoading.value = false;
      }
    };

    const downloadBatch = async (batch: CASInvoiceBatchModel) => {
      try {
        batch.downloadInProgress = true;
        snackBar.success(`Batch ${batch.batchName} report generation started.`);
        await CASInvoiceBatchService.shared.downloadCASInvoiceBatchReport(
          batch.id,
        );
      } catch (error: unknown) {
        snackBar.error("Unexpected error while downloading the batch.");
      } finally {
        batch.downloadInProgress = false;
      }
    };

    const approveBatch = async (batch: CASInvoiceBatchModel) => {
      if (await approveBatchModal.value.showModal()) {
        try {
          batch.approvalInProgress = true;
          await CASInvoiceBatchService.shared.updateCASInvoiceBatch(batch.id, {
            approvalStatus: CASInvoiceBatchApprovalStatus.Approved,
          });
          snackBar.success(
            `Batch ${batch.batchName} has been approved and added to the queue.`,
          );
          loadInvoiceBatches();
        } catch (error: unknown) {
          snackBar.error(`Unexpected error updating batch ${batch.batchName}.`);
        } finally {
          batch.approvalInProgress = false;
        }
      }
    };

    const rejectBatch = async (batch: CASInvoiceBatchModel) => {
      if (await rejectBatchModal.value.showModal()) {
        try {
          batch.approvalInProgress = true;
          await CASInvoiceBatchService.shared.updateCASInvoiceBatch(batch.id, {
            approvalStatus: CASInvoiceBatchApprovalStatus.Rejected,
          });
          snackBar.success(`Batch ${batch.batchName} has been rejected.`);
          loadInvoiceBatches();
        } catch (error: unknown) {
          snackBar.error(`Unexpected error updating batch ${batch.batchName}.`);
        } finally {
          batch.approvalInProgress = false;
        }
      }
    };

    const pageSortEvent = async (event: DataTableOptions) => {
      currentPagination.page = event.page;
      currentPagination.pageLimit = event.itemsPerPage;
      if (event.sortBy.length) {
        const [sortBy] = event.sortBy;
        currentPagination.sortField = sortBy.key;
        currentPagination.sortOrder = sortBy.order;
      } else {
        // Sorting was removed, reset to default.
        currentPagination.sortField = DEFAULT_SORT_FIELD;
        currentPagination.sortOrder = DataTableSortOrder.DESC;
      }
      await loadInvoiceBatches();
    };

    const filterByApprovalStatus = async () => {
      if (approvalStatusFilter.value.includes(ApprovalStatusFilter.All)) {
        currentPagination.searchCriteria = undefined;
      } else {
        currentPagination.searchCriteria = {
          approvalStatusSearch: approvalStatusFilter.value.toString(),
        };
      }
      await loadInvoiceBatches();
    };

    return {
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      Role,
      CASInvoicesBatchesHeaders,
      dateOnlyLongString,
      getISODateHourMinuteString,
      invoiceBatchesLoading,
      paginatedBatches,
      downloadBatch,
      pageSortEvent,
      CASInvoiceBatchApprovalStatus,
      filterByApprovalStatus,
      ApprovalStatusFilter,
      approvalStatusFilter,
      approveBatch,
      rejectBatch,
      approveBatchModal,
      rejectBatchModal,
      LayoutTemplates,
    };
  },
});
</script>
