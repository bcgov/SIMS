<template>
  <tab-container>
    <body-header-container>
      <template #header>
        <body-header title="Activity" :records-count="msfaaActivity?.length" />
      </template>
      <content-group>
        <toggle-content
          :toggled="!msfaaActivity?.length"
          message="No MSFAA records found."
        >
          <v-data-table
            :headers="MSFAAActivityHeaders"
            :items="msfaaActivity"
            :loading="isLoading"
          >
            <template #loading>
              <v-skeleton-loader type="table-row@5" />
            </template>
            <template #[`item.createdAt`]="{ item }">
              {{ dateOnlyLongString(item.createdAt) }}
            </template>
            <template #[`item.offeringIntensity`]="{ item }">
              {{ mapOfferingIntensity(item.offeringIntensity) }}
            </template>
            <template #[`item.dateSent`]="{ item }">
              {{
                item.dateSent
                  ? dateOnlyLongString(item.dateSent)
                  : emptyStringFiller()
              }}
            </template>
            <template #[`item.dateSigned`]="{ item }">
              {{
                item.dateSigned
                  ? dateOnlyLongString(item.dateSigned)
                  : emptyStringFiller()
              }}
            </template>
            <template #[`item.cancelledDate`]="{ item }">
              {{
                item.cancelledDate
                  ? dateOnlyLongString(item.cancelledDate)
                  : emptyStringFiller()
              }}
            </template>
            <template #[`item.newIssuingProvince`]="{ item }">
              {{ emptyStringFiller(item.newIssuingProvince) }}
            </template>
          </v-data-table>
        </toggle-content>
      </content-group>
    </body-header-container>
  </tab-container>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { useFormatters, useOffering, useSnackBar } from "@/composables";
import { MSFAANumberService } from "@/services/MSFAANumberService";
import { MSFAANumberAPIOutDTO } from "@/services/http/dto";
import { MSFAAActivityHeaders } from "@/types/contracts/DataTableContract";

const props = defineProps({
  studentId: {
    type: Number,
    required: true,
  },
});

const { mapOfferingIntensity } = useOffering();
const { dateOnlyLongString, emptyStringFiller } = useFormatters();
const snackBar = useSnackBar();
const isLoading = ref(false);
const msfaaActivity = ref<MSFAANumberAPIOutDTO[]>([]);

const loadMSFAAActivity = async () => {
  try {
    isLoading.value = true;
    msfaaActivity.value =
      await MSFAANumberService.shared.getStudentMSFAAActivity(props.studentId);
  } catch {
    snackBar.error("An error occurred while loading MSFAA activity.");
  } finally {
    isLoading.value = false;
  }
};

watchEffect(async () => {
  await loadMSFAAActivity();
});
</script>
