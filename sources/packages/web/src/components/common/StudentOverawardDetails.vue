<template>
  <body-header-container :enableCardView="true">
    <template #header>
      <body-header
        title="Overaward balances"
        title-header-level="2"
        subTitle="A balance of overawards broken down by award type"
      />
    </template>
    <v-row>
      <v-col>
        <title-value
          :propertyValue="
            formatCurrency(overawardBalance.overawardBalanceValues?.CSLF)
          "
        >
          <template #title>
            {{ FullTimeAwardTypes.CSLF }}
            <tooltip-icon>{{
              getAwardDescription(FullTimeAwardTypes.CSLF)
            }}</tooltip-icon></template
          ></title-value
        >
      </v-col>
      <v-col>
        <title-value
          :propertyValue="
            formatCurrency(overawardBalance.overawardBalanceValues?.CSLP)
          "
        >
          <template #title>
            {{ PartTimeAwardTypes.CSLP }}
            <tooltip-icon>{{
              getAwardDescription(PartTimeAwardTypes.CSLP)
            }}</tooltip-icon></template
          ></title-value
        >
      </v-col>
      <v-col>
        <title-value
          :propertyValue="
            formatCurrency(overawardBalance.overawardBalanceValues?.BCSL)
          "
        >
          <template #title>
            {{ FullTimeAwardTypes.BCSL }}
            <tooltip-icon>{{
              getAwardDescription(FullTimeAwardTypes.BCSL)
            }}</tooltip-icon></template
          >
        </title-value>
      </v-col>
    </v-row>
  </body-header-container>

  <overaward-details
    :studentId="studentId"
    :showAddedBy="showAddedBy"
    :allowManualOverawardDeduction="allowManualOverawardDeduction"
    @manualOverawardAdded="loadOverawardBalance"
  />
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { OverawardService } from "@/services/OverawardService";
import { useFormatters } from "@/composables";
import {
  AWARDS,
  FullTimeAwardTypes,
  PartTimeAwardTypes,
} from "@/constants/award-constants";
import { OverawardBalanceAPIOutDTO } from "@/services/http/dto";
import OverawardDetails from "@/components/common/OverawardDetails.vue";

export default defineComponent({
  components: { OverawardDetails },
  props: {
    studentId: {
      type: Number,
      required: false,
    },
    showAddedBy: {
      type: Boolean,
      required: false,
      default: false,
    },
    allowManualOverawardDeduction: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const { formatCurrency } = useFormatters();
    const overawardBalance = ref({} as OverawardBalanceAPIOutDTO);

    const getAwardDescription = (awardType: string): string | undefined => {
      return AWARDS.find((award) => award.awardType === awardType)?.description;
    };

    const loadOverawardBalance = async () => {
      overawardBalance.value =
        await OverawardService.shared.getOverawardBalance(props.studentId);
    };

    onMounted(loadOverawardBalance);

    return {
      overawardBalance,
      formatCurrency,
      getAwardDescription,
      loadOverawardBalance,
      FullTimeAwardTypes,
      PartTimeAwardTypes,
    };
  },
});
</script>
