<template>
  <full-page-container class="overflow-visible">
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
        >
          <template #actions>
            <check-permission-role :role="Role.AESTEditCASSupplierInfo">
              <template #="{ notAllowed }">
                <v-btn
                  class="mr-2 float-right"
                  color="primary"
                  :disabled="notAllowed"
                  @click="createNewBatch"
                  prepend-icon="fa:fa fa-plus-circle"
                  >Create new batch</v-btn
                >
              </template>
            </check-permission-role>
          </template>
        </body-header>
      </template>
      <content-group>
        <toggle-content
          :toggled="!invoiceBatches?.length && !invoiceBatchesLoading"
        >
          <v-data-table
            :headers="CASInvoicesHeaders"
            :items="invoiceBatches"
            :items-per-page="DEFAULT_PAGE_LIMIT"
            :items-per-page-options="ITEMS_PER_PAGE"
            :loading="invoiceBatchesLoading"
          >
            <template #[`item.batchDate`]="{ item }">
              {{ dateOnlyLongString(item.batchDate) }}
            </template>
            <template #[`item.batchName`]="{ item }">
              {{ item.batchName }}
            </template>
            <template #[`item.approvalStatus`]="{ item }">
              {{ item.approvalStatus }}
            </template>
            <template #[`item.approvalStatusUpdatedOn`]="{ item }">
              {{ dateOnlyToLocalDateTimeString(item.approvalStatusUpdatedOn) }}
            </template>
            <template #[`item.approvalStatusUpdatedBy`]="{ item }">
              {{ item.approvalStatusUpdatedBy }}
            </template>
            <template #[`item.download`]="{ item }">
              <check-permission-role :role="Role.AESTEditCASSupplierInfo">
                <template #="{ notAllowed }">
                  <v-btn
                    color="primary"
                    :disabled="notAllowed"
                    @click="downloadBatch(item.id)"
                  >
                    Download</v-btn
                  >
                </template>
              </check-permission-role>
            </template>
          </v-data-table>
        </toggle-content>
      </content-group>
    </body-header-container>
  </full-page-container>
</template>

<script lang="ts">
import { useFormatters, useSnackBar } from "@/composables";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { CASInvoiceBatchService } from "@/services/CASInvoiceBatchService";
import { CASInvoiceBatchAPIOutDTO } from "@/services/http/dto";
import {
  CASInvoicesHeaders,
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  Role,
} from "@/types";
import { defineComponent, onMounted, ref } from "vue";

export default defineComponent({
  components: {
    CheckPermissionRole,
  },
  setup() {
    const snackBar = useSnackBar();
    const { dateOnlyLongString, dateOnlyToLocalDateTimeString } =
      useFormatters();
    const invoiceBatchesLoading = ref(false);
    const invoiceBatches = ref([] as CASInvoiceBatchAPIOutDTO[]);

    onMounted(async () => {
      try {
        invoiceBatchesLoading.value = true;
        const { batches } =
          await CASInvoiceBatchService.shared.getInvoiceBatches();
        invoiceBatches.value = batches;
      } catch (error: unknown) {
        snackBar.error("Unexpected error while loading CAS invoices.");
      } finally {
        invoiceBatchesLoading.value = false;
      }
    });

    const createNewBatch = async () => {
      try {
        // TODO: call the service.
        //await CASInvoiceBatchService.shared.createNewInvoiceBatch();
        snackBar.success("New invoice batch has been created.");
        const { batches } =
          await CASInvoiceBatchService.shared.getInvoiceBatches();
        invoiceBatches.value = batches;
      } catch (error: unknown) {
        snackBar.error("Unexpected error while creating new invoice batch.");
      }
    };

    const downloadBatch = async (batchId: number) => {
      try {
        console.log(batchId);
        // TODO: call the service.
        //await CASInvoiceBatchService.shared.downloadInvoiceBatch(batchId);
        snackBar.success("Invoice batch has been downloaded.");
      } catch (error: unknown) {
        snackBar.error("Unexpected error while downloading invoice batch.");
      }
    };

    return {
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      Role,
      CASInvoicesHeaders,
      dateOnlyLongString,
      dateOnlyToLocalDateTimeString,
      invoiceBatchesLoading,
      invoiceBatches,
      createNewBatch,
      downloadBatch,
    };
  },
});
</script>
