<template>
  <v-container>
    <h5 class="text-muted">
      <a @click="goBack()">
        <v-icon left> mdi-arrow-left </v-icon> Back to Institution</a
      >
    </h5>
    <h2 class="color-blue">{{ institutionDetail }}</h2>
    <h2 class="mt-2">Institution Details page is in Progress</h2>
  </v-container>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { InstitutionService } from "@/services/InstitutionService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { AESTInstitutionDetailDto } from "@/types";
export default {
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const institutionDetail = ref({});
    const goBack = () => {
      router.push({
        name: AESTRoutesConst.SEARCH_INSTITUTIONS,
      });
    };

    onMounted(async () => {
      institutionDetail.value = await Promise.all([
        InstitutionService.shared.getAESTInstitutionDetailById(
          props.institutionId,
        ),
      ]);
    });
    return {
      institutionDetail,
      goBack,
    };
  },
};
</script>
