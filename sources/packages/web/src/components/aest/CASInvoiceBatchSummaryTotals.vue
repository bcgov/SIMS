<template>
  <v-skeleton-loader v-if="loading" type="table-row@5" />
  <template v-else-if="summaryTotals">
    <h3 class="category-header-medium secondary-color">Processing Summary</h3>
    <v-table>
      <thead>
        <tr>
          <th
            v-for="invoiceStatusCount in sortedInvoiceStatusCounts"
            :key="invoiceStatusCount.invoiceStatus"
            scope="col"
            class="text-left"
          >
            {{ getInvoiceStatusLabel(invoiceStatusCount.invoiceStatus) }}
          </th>
          <th scope="col" class="text-left">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td
            v-for="invoiceStatusCount in sortedInvoiceStatusCounts"
            :key="invoiceStatusCount.invoiceStatus"
          >
            {{ invoiceStatusCount.count }}
          </td>
          <td class="font-weight-bold">
            {{ summaryTotals.processingSummary.totalInvoices }}
          </td>
        </tr>
      </tbody>
    </v-table>
    <h3 class="category-header-medium secondary-color mt-6">Award Totals</h3>
    <v-table v-if="summaryTotals.distributionTypeAmounts.length" striped="even">
      <thead>
        <tr>
          <th scope="col" class="text-left">Distribution Type</th>
          <th scope="col" class="text-left">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="distributionTypeAmount in summaryTotals.distributionTypeAmounts"
          :key="getDistributionTypeLabel(distributionTypeAmount)"
        >
          <td>
            {{ getDistributionTypeLabel(distributionTypeAmount) }}
          </td>
          <td>
            {{ formatCurrency(distributionTypeAmount.total) }}
          </td>
        </tr>
      </tbody>
    </v-table>
    <p v-else>No distribution amounts for this batch.</p>
  </template>
</template>

<script setup lang="ts">
import { useFormatters, useOffering, useSnackBar } from "@/composables";
import { CASInvoiceBatchService } from "@/services/CASInvoiceBatchService";
import {
  CASInvoiceBatchDistributionTypeAmountAPIOutDTO,
  CASInvoiceBatchSummaryTotalsAPIOutDTO,
} from "@/services/http/dto";
import { CASInvoiceStatus } from "@/types";
import { computed, onMounted, ref } from "vue";

interface Props {
  casInvoiceBatchId: number;
}

/**
 * Label and display order of each invoice status in the processing summary.
 */
const InvoiceStatusDisplay: Record<
  CASInvoiceStatus,
  { label: string; order: number }
> = {
  [CASInvoiceStatus.Sent]: { label: "Success", order: 1 },
  [CASInvoiceStatus.ManualIntervention]: { label: "Error", order: 2 },
  [CASInvoiceStatus.Resolved]: { label: "Resolved", order: 3 },
  [CASInvoiceStatus.Pending]: { label: "Pending", order: 4 },
};

const props = defineProps<Props>();
const snackBar = useSnackBar();
const { formatCurrency } = useFormatters();
const { mapOfferingIntensityAbbreviation } = useOffering();
const loading = ref(true);
const summaryTotals = ref<CASInvoiceBatchSummaryTotalsAPIOutDTO>();

/**
 * Loads the batch summary totals every time the component is mounted,
 * which happens every time the batch row is expanded, to ensure the
 * most recent invoice statuses are displayed.
 */
onMounted(async () => {
  try {
    loading.value = true;
    summaryTotals.value =
      await CASInvoiceBatchService.shared.getCASInvoiceBatchSummaryTotals(
        props.casInvoiceBatchId,
      );
  } catch {
    snackBar.error("Unexpected error while loading the batch details.");
  } finally {
    loading.value = false;
  }
});

/**
 * Invoice status counts sorted in the display order.
 */
const sortedInvoiceStatusCounts = computed(() =>
  summaryTotals.value?.processingSummary.invoiceStatusCounts.toSorted(
    (a, b) =>
      InvoiceStatusDisplay[a.invoiceStatus].order -
      InvoiceStatusDisplay[b.invoiceStatus].order,
  ),
);

/**
 * Gets the label of an invoice status to be displayed in the processing summary.
 * @param invoiceStatus invoice status to get the label for.
 * @returns invoice status label.
 */
const getInvoiceStatusLabel = (invoiceStatus: CASInvoiceStatus): string =>
  InvoiceStatusDisplay[invoiceStatus].label;

/**
 * Gets the distribution type label, for instance, BCAG-FT DR.
 * @param distributionTypeAmount distribution type amount to get the label for.
 * @returns distribution type label.
 */
const getDistributionTypeLabel = (
  distributionTypeAmount: CASInvoiceBatchDistributionTypeAmountAPIOutDTO,
): string =>
  `${distributionTypeAmount.awardValueCode}-${mapOfferingIntensityAbbreviation(
    distributionTypeAmount.offeringIntensity,
  )} ${distributionTypeAmount.operationCode}`;
</script>
