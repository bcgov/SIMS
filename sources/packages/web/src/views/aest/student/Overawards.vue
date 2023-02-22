<template>
  <p class="header-sub-title mt-9">Overawards</p>
  <v-card>
    <v-container>
      <body-header
        title="Overaward balances"
        subTitle="A balance of overawards broken down by award type"
      />
      <v-row>
        <v-col>
          <title-value
            :propertyValue="
              formatOverawardValue(
                overawardBalance.overawardBalanceValues?.CSLF,
              )
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
              formatOverawardValue(
                overawardBalance.overawardBalanceValues?.CSLP,
              )
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
              formatOverawardValue(
                overawardBalance.overawardBalanceValues?.BCSL,
              )
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
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { OverawardService } from "@/services/OverawardService";
import { useFormatters, useSnackBar } from "@/composables";
import {
  StudentNoteType,
  NoteEntityType,
  LayoutTemplates,
  Role,
} from "@/types";
import {
  FULL_TIME_AWARDS,
  PART_TIME_AWARDS,
} from "@/constants/award-constants";
import { OverawardBalanceAPIOutDTO } from "@/services/http/dto";

export default defineComponent({
  components: {},
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const overawardBalance = ref({} as OverawardBalanceAPIOutDTO);

    const formatOverawardValue = (awardValue: string | number): string => {
      return awardValue ? `$${awardValue}` : `$0.00`;
    };

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
      formatOverawardValue,
      getAwardDescription,
      Role,
    };
  },
});
</script>
