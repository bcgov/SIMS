<template>
  <body-header-container :enableCardView="true">
    <template #header>
      <body-header
        title="Manual Intervention Invoices"
        subTitle="Please see below the list of manual intervention invoices."
        :recordsCount="paginatedInvoices.count"
      />
    </template>
    <content-group>
      <toggle-content :toggled="!paginatedInvoices.count && !invoiceLoading">
        <v-data-table-server
          :headers="CASInvoiceHeaders"
          :items="paginatedInvoices.results"
          :items-length="paginatedInvoices.count"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          :loading="invoiceLoading"
          @update:options="pageSortEvent"
        >
          <template #[`item.invoiceStatusUpdatedOn`]="{ item }">
            {{ getISODateHourMinuteString(item.invoiceStatusUpdatedOn) }}
          </template>
          <template #[`item.batchName`]="{ item }">
            {{ item.invoiceBatchName }}
          </template>
          <template #[`item.invoiceNumber`]="{ item }">
            {{ item.invoiceNumber }}
          </template>
          <template #[`item.supplierNumber`]="{ item }">
            {{ item.supplierNumber }}
          </template>
          <template #[`item.actions`]="{ item }">
            <check-permission-role :role="Role.AESTCASInvoicing">
              <template #="{ notAllowed }">
                <v-btn
                  :disabled="notAllowed || item.resolutionInProgress"
                  @click="resolveInvoice(item)"
                  variant="text"
                  color="primary"
                  text="Resolve Invoice"
                >
                  <span class="text-decoration-underline"
                    ><strong>Resolve Invoice</strong></span
                  >
                </v-btn>
              </template>
            </check-permission-role>
          </template>
          <template v-slot:expanded-row="{ item, columns }">
            <tr>
              <td :colspan="columns.length">
                <ul>
                  <li v-for="(error, index) in item.errors" :key="index">
                    {{ error }}
                  </li>
                </ul>
              </td>
            </tr>
          </template>
          <template
            v-slot:[`item.data-table-expand`]="{
              item,
              internalItem,
              isExpanded,
              toggleExpand,
            }"
          >
            <v-btn
              v-if="item.errors && item.errors.length > 0"
              :icon="
                isExpanded(internalItem)
                  ? '$expanderCollapseIcon'
                  : '$expanderExpandIcon'
              "
              variant="text"
              @click="toggleExpand(internalItem)"
            ></v-btn>
          </template>
        </v-data-table-server>
      </toggle-content>
    </content-group>
  </body-header-container>
  <confirm-modal
    title="Resolve invoice"
    ref="resolveInvoiceModal"
    okLabel="Resolve invoice"
    cancelLabel="Cancel"
    text="Are you sure you want to resolve the invoice?"
  />
</template>
<script lang="ts">
import { ModalDialog, useFormatters, useSnackBar } from "@/composables";
import { PaginatedResultsAPIOutDTO } from "@/services/http/dto";
import {
  CASInvoiceHeaders,
  CASInvoiceStatus,
  DataTableOptions,
  DataTableSortOrder,
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  PaginationOptions,
  Role,
} from "@/types";
import { defineComponent, onMounted, ref } from "vue";
import { CASInvoiceService } from "@/services/CASInvoiceService";
import { CASInvoiceAPIOutDTO } from "@/services/http/dto/CASInvoice.dto";
import ConfirmModal from "@/components/common/modals/ConfirmModal.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

interface CASInvoiceModel extends CASInvoiceAPIOutDTO {
  resolutionInProgress?: boolean;
}
const DEFAULT_SORT_FIELD = "invoiceStatusUpdatedOn";
export default defineComponent({
  components: {
    CheckPermissionRole,
    ConfirmModal,
  },
  setup() {
    const snackBar = useSnackBar();
    const { getISODateHourMinuteString } = useFormatters();
    const invoiceLoading = ref(false);
    const resolveInvoiceModal = ref({} as ModalDialog<boolean>);
    /**
     * Pagination with invoice details.
     */
    const paginatedInvoices = ref(
      {} as PaginatedResultsAPIOutDTO<CASInvoiceModel>,
    );
    /**
     * Current state of the pagination.
     */
    const currentPagination: PaginationOptions = {
      page: 1,
      pageLimit: DEFAULT_PAGE_LIMIT,
      sortField: DEFAULT_SORT_FIELD,
      sortOrder: DataTableSortOrder.ASC,
    };

    onMounted(async () => {
      await loadManualInterventionInvoices();
    });

    const loadManualInterventionInvoices = async () => {
      try {
        invoiceLoading.value = true;
        currentPagination.searchCriteria = {
          invoiceStatusSearch: CASInvoiceStatus.ManualIntervention,
        };
        paginatedInvoices.value = await CASInvoiceService.shared.getInvoices({
          ...currentPagination,
        });
      } catch (error: unknown) {
        snackBar.error("Unexpected error while loading CAS invoices.");
      } finally {
        invoiceLoading.value = false;
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
        currentPagination.sortOrder = DataTableSortOrder.ASC;
      }
      await loadManualInterventionInvoices();
    };

    const resolveInvoice = async (invoice: CASInvoiceModel) => {
      if (await resolveInvoiceModal.value.showModal()) {
        try {
          invoice.resolutionInProgress = true;
          await CASInvoiceService.shared.resolveCASInvoice(invoice.id);
          snackBar.success("Invoice resolved.");
          await loadManualInterventionInvoices();
        } catch (error: unknown) {
          snackBar.error("Unexpected error while resolving the invoice.");
        } finally {
          invoice.resolutionInProgress = false;
        }
      }
    };

    return {
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      Role,
      paginatedInvoices,
      invoiceLoading,
      CASInvoiceHeaders,
      getISODateHourMinuteString,
      pageSortEvent,
      resolveInvoice,
      resolveInvoiceModal,
    };
  },
});
</script>
