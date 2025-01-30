<template>
  <full-page-container :full-width="true">
    <template #header
      ><header-navigator
        title="Corporate Accounting Services"
        subTitle="Invoices"
      />
    </template>
    <body-header-container>
      <template #header>
        <body-header
          title="Accounts payable invoicing"
          subTitle="Please see below the list of invoices batches."
          :recordsCount="paginatedBatches.count"
        >
          <template #actions>
            <v-btn-toggle
              multiple
              mandatory
              class="float-right btn-toggle"
              selected-class="selected-btn-toggle"
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
            :headers="CASInvoicesHeaders"
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
            <template #[`item.approvalStatusUpdatedOn`]="{ item }">
              {{ getISODateHourMinuteString(item.approvalStatusUpdatedOn) }}
            </template>
            <template #[`item.approvalStatusUpdatedBy`]="{ item }">
              {{ item.approvalStatusUpdatedBy }}
            </template>
            <template #[`item.actions`]="{ item }">
              <!-- TODO: change role -->
              <check-permission-role :role="Role.AESTEditCASSupplierInfo">
                <template #="{ notAllowed }">
                  <v-btn
                    :disabled="notAllowed"
                    @click="downloadBatch(item.id)"
                    variant="text"
                    color="primary"
                  >
                    <span class="text-decoration-underline"
                      ><strong>Download</strong></span
                    >
                  </v-btn>
                  <v-btn :disabled="notAllowed" variant="text" color="primary">
                    <span class="text-decoration-underline"
                      ><strong>Approve</strong></span
                    >
                  </v-btn>
                  <v-btn :disabled="notAllowed" variant="text" color="primary">
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
  </full-page-container>
</template>

<script lang="ts">
import { useFormatters, useSnackBar } from "@/composables";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { CASInvoiceBatchService } from "@/services/CASInvoiceBatchService";
import {
  CASInvoiceBatchAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import {
  CASInvoiceBatchApprovalStatus,
  CASInvoicesHeaders,
  DataTableOptions,
  DataTableSortOrder,
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  PaginationOptions,
  Role,
} from "@/types";
import { defineComponent, onMounted, ref } from "vue";
import StatusInvoiceBatchApproval from "@/components/generic/StatusInvoiceBatchApproval.vue";

const DEFAULT_SORT_FIELD = "batchDate";

export default defineComponent({
  components: {
    CheckPermissionRole,
    StatusInvoiceBatchApproval,
  },
  setup() {
    const snackBar = useSnackBar();
    const { getISODateHourMinuteString } = useFormatters();
    const invoiceBatchesLoading = ref(false);
    /**
     * Pagination with batch invoices and the total available.
     */
    const paginatedBatches = ref(
      {} as PaginatedResultsAPIOutDTO<CASInvoiceBatchAPIOutDTO>,
    );
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
          await CASInvoiceBatchService.shared.getInvoiceBatches(
            currentPagination,
          );
      } catch (error: unknown) {
        snackBar.error("Unexpected error while loading CAS invoices.");
      } finally {
        invoiceBatchesLoading.value = false;
      }
    };

    const downloadBatch = async (batchId: number) => {
      try {
        snackBar.warn(
          `Invoice batch downloaded to be implemented (Batch ID ${batchId}).`,
        );
      } catch (error: unknown) {
        snackBar.error("Unexpected error while downloading invoice batch.");
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

    return {
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      Role,
      CASInvoicesHeaders,
      getISODateHourMinuteString,
      invoiceBatchesLoading,
      paginatedBatches,
      downloadBatch,
      pageSortEvent,
      CASInvoiceBatchApprovalStatus,
    };
  },
});
</script>
