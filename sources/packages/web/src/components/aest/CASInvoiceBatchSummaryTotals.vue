<template>
  <v-progress-linear v-if="loading" indeterminate color="primary" />
  <v-row v-else-if="summaryTotals">
    <v-col cols="12" lg="6">
      <h3 class="category-header-medium secondary-color">Processing Summary</h3>
      <ul>
        <li>
          Total Invoices: {{ summaryTotals.processingSummary.totalInvoices }}
        </li>
        <li>Pending: {{ summaryTotals.processingSummary.totalPending }}</li>
        <li>Sent: {{ summaryTotals.processingSummary.totalSent }}</li>
        <li>
          Manual intervention:
          {{ summaryTotals.processingSummary.totalManualIntervention }}
        </li>
        <li>Resolved: {{ summaryTotals.processingSummary.totalResolved }}</li>
      </ul>
    </v-col>
    <v-col cols="12" lg="6">
      <h3 class="category-header-medium secondary-color">Award Totals</h3>
      <ul v-if="summaryTotals.awardAmounts.length" class="ml-4">
        <li
          v-for="distributionTotal in summaryTotals.awardAmounts"
          :key="getDistributionTotalLabel(distributionTotal)"
        >
          {{ getDistributionTotalLabel(distributionTotal) }}:
          {{ formatCurrency(distributionTotal.total) }}
        </li>
      </ul>
      <p v-else>No distribution amounts for this batch.</p>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { useFormatters, useOffering, useSnackBar } from "@/composables";
import { CASInvoiceBatchService } from "@/services/CASInvoiceBatchService";
import {
  CASInvoiceBatchAwardAmountAPIOutDTO,
  CASInvoiceBatchSummaryTotalsAPIOutDTO,
} from "@/services/http/dto";
import { onMounted, ref } from "vue";

interface Props {
  casInvoiceBatchId: number;
}

const props = defineProps<Props>();
const snackBar = useSnackBar();
const { formatCurrency } = useFormatters();
const { mapOfferingIntensityAbbreviation } = useOffering();
const loading = ref(false);
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
    snackBar.error("Unexpected error while loading the batch summary totals.");
  } finally {
    loading.value = false;
  }
});

/**
 * Gets the distribution account type label, for instance, BCAG-FT DR.
 * @param distributionTotal distribution total to get the label for.
 * @returns distribution account type label.
 */
const getDistributionTotalLabel = (
  distributionTotal: CASInvoiceBatchAwardAmountAPIOutDTO,
): string =>
  `${distributionTotal.awardValueCode}-${mapOfferingIntensityAbbreviation(
    distributionTotal.offeringIntensity,
  )} ${distributionTotal.operationCode}`;
</script>
