<template>
  <v-container>
    <div class="mb-4">
      <p class="muted-heading-text">
        <a @click="goBack()">
          <v-icon left> mdi-arrow-left </v-icon> Back all programs</a
        >
      </p>
      <p class="heading-x-large">View program</p>
    </div>
    <ManageProgramAndOfferingSummary
      :programId="programId"
      :locationId="locationId"
      :clientType="ClientIdType.AEST"
    />
  </v-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import ManageProgramAndOfferingSummary from "@/components/common/ManageProgramAndOfferingSummary.vue";
import { ClientIdType } from "@/types";

export default {
  components: { ManageProgramAndOfferingSummary },
  props: {
    programId: {
      type: Number,
      required: true,
    },
    institutionId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const goBack = () => {
      router.push({
        name: AESTRoutesConst.INSTITUTION_PROGRAMS,
        params: {
          institutionId: props.institutionId,
        },
      });
    };

    return {
      goBack,
      ClientIdType,
    };
  },
};
</script>
