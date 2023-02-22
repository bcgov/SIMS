<template>
  <v-card class="mb-5">
    <v-container>
      <body-header
        title="Overaward balances"
        subTitle="A balance of overawards broken down by award type"
      />
      <v-row>
        <v-col>
          <title-value
            :propertyValue="
              formatCurrency(overawardBalance.overawardBalanceValues?.CSLF, '')
            "
          >
            <template #title>
              CSLF
              <tooltip-icon>{{
                getAwardDescription("CSLF")
              }}</tooltip-icon></template
            ></title-value
          >
        </v-col>
        <v-col>
          <title-value
            :propertyValue="
              formatCurrency(overawardBalance.overawardBalanceValues?.CSLP, '')
            "
          >
            <template #title>
              CSLP
              <tooltip-icon>{{
                getAwardDescription("CSLP")
              }}</tooltip-icon></template
            ></title-value
          >
        </v-col>
        <v-col>
          <title-value
            :propertyValue="
              formatCurrency(overawardBalance.overawardBalanceValues?.BCSL, '')
            "
          >
            <template #title>
              BCSL
              <tooltip-icon>{{
                getAwardDescription("BCSL")
              }}</tooltip-icon></template
            >
          </title-value>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
  <overaward-details :studentId="studentId" :showAddedBy="showAddedBy" />
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { OverawardService } from "@/services/OverawardService";
import { useFormatters } from "@/composables";
import {
  FULL_TIME_AWARDS,
  PART_TIME_AWARDS,
} from "@/constants/award-constants";
import { OverawardBalanceAPIOutDTO } from "@/services/http/dto";
import OverawardDetails from "@/components/common/OverawardDetails.vue";

export default defineComponent({
  components: { OverawardDetails },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    showAddedBy: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const { formatCurrency } = useFormatters();
    const overawardBalance = ref({} as OverawardBalanceAPIOutDTO);

    const getAwardDescription = (awardType: string): string | undefined => {
      const awards = [...FULL_TIME_AWARDS, ...PART_TIME_AWARDS];
      return awards.find((award) => award.awardType === awardType)?.description;
    };

    onMounted(async () => {
      overawardBalance.value =
        await OverawardService.shared.getOverawardBalance(props.studentId);
    });
    return {
      overawardBalance,
      formatCurrency,
      getAwardDescription,
    };
  },
});
</script>
