<template>
  <h5 class="text-muted">
    <a @click="goBack()">
      <v-icon left> mdi-arrow-left </v-icon> Back to Institution</a
    >
  </h5>
  <full-page-container>
    <h2 color="primary-color">
      {{ initialValue.operatingName }}
      <!-- TODO: Replace v-badge with vuetify2 equavalent v-chip with icon once veutify3 is released-->
      <v-badge
        color="green"
        content="&#10004;  DESIGNATED"
        location="top-right"
        text-color="white"
        ><template v-slot:default>
          <v-icon :size="25">mdi-map-markers-radius</v-icon>
        </template>
      </v-badge>
    </h2>
    <v-tabs align-with-title>
      <v-tab>Tab 1</v-tab>
      <v-tab>Tab 2</v-tab>
      <v-tab>Tab 3</v-tab>
    </v-tabs>
  </full-page-container>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { InstitutionService } from "@/services/InstitutionService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import { BasicInstitutionInfo } from "@/types";
export default {
  components: { FullPageContainer },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const initialValue = ref({} as BasicInstitutionInfo);
    const goBack = () => {
      router.push({
        name: AESTRoutesConst.SEARCH_INSTITUTIONS,
      });
    };

    onMounted(async () => {
      initialValue.value = await InstitutionService.shared.getBasicInstitutionInfoById(
        props.institutionId,
      );
    });
    return {
      initialValue,
      goBack,
    };
  },
};
</script>
