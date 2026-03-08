<template>
  <tab-container>
    <body-header-container>
      <template #header>
        <body-header title="Active MSFAA Numbers" />
      </template>
      <content-group>
        <v-row>
          <v-col>
            <title-value
              property-title="Full-time"
              :property-value="
                emptyStringFiller(activeMSFAANumbers?.fullTimeMSFAANumber)
              "
            />
          </v-col>
          <v-col>
            <title-value
              property-title="Part-time"
              :property-value="
                emptyStringFiller(activeMSFAANumbers?.partTimeMSFAANumber)
              "
            />
          </v-col>
        </v-row>
      </content-group>
    </body-header-container>
    <body-header-container>
      <template #header>
        <body-header title="Activity" :records-count="msfaaActivity?.length" />
      </template>
      <content-group>
        <toggle-content
          :toggled="!msfaaActivity?.length"
          message="No MSFAA records found."
        >
          <v-data-table :headers="MSFAAActivityHeaders" :items="msfaaActivity">
            <template #[`item.createdAt`]="{ item }">
              {{ dateOnlyLongString(item.createdAt) }}
            </template>
            <template #[`item.offeringIntensity`]="{ item }">
              {{ item.offeringIntensity }}
            </template>
            <template #[`item.msfaaNumber`]="{ item }">
              {{ item.msfaaNumber }}
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
import { ref, computed, onMounted } from "vue";
import { useFormatters } from "@/composables";
import { MSFAANumberService } from "@/services/MSFAANumberService";
import { MSFAANumberAPIOutDTO } from "@/services/http/dto";
import { MSFAAActivityHeaders } from "@/types/contracts/DataTableContract";
import { OfferingIntensity } from "@/types";

const props = defineProps({
  studentId: {
    type: Number,
    required: true,
  },
});

const { dateOnlyLongString, emptyStringFiller } = useFormatters();

const msfaaActivity = ref<MSFAANumberAPIOutDTO[]>([]);

/** The active MSFAA number is the most recent signed and not cancelled one per intensity. */
const activeMSFAANumbers = computed(() => ({
  fullTimeMSFAANumber: msfaaActivity.value.find(
    (r) =>
      r.offeringIntensity === OfferingIntensity.fullTime &&
      r.dateSigned &&
      !r.cancelledDate,
  )?.msfaaNumber,
  partTimeMSFAANumber: msfaaActivity.value.find(
    (r) =>
      r.offeringIntensity === OfferingIntensity.partTime &&
      r.dateSigned &&
      !r.cancelledDate,
  )?.msfaaNumber,
}));

const loadMSFAAActivity = async () => {
  msfaaActivity.value = await MSFAANumberService.shared.getStudentMSFAAActivity(
    props.studentId,
  );
};

onMounted(async () => {
  await loadMSFAAActivity();
});
</script>
