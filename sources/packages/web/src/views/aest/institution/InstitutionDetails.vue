<template>
  <h5 class="text-muted">
    <a @click="goBack()">
      <v-icon left> mdi-arrow-left </v-icon> Back to Institution</a
    >
  </h5>
  <full-page-container>
    <h2 color="primary-color" class="mb-15">
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
      <v-tab><v-btn @click="showProfile(institutionId)">Profile</v-btn></v-tab>
      <v-tab><v-btn @click="showProfile(institutionId)">Programs</v-btn></v-tab>
      <v-tab
        ><v-btn @click="showProfile(institutionId)">Locations</v-btn></v-tab
      >
      <v-tab><v-btn @click="showProfile(institutionId)">Users</v-btn></v-tab>
      <v-tab
        ><v-btn @click="showProfile(institutionId)">Restrictions</v-btn></v-tab
      >
      <v-tab><v-btn @click="showProfile(institutionId)">Notes</v-btn></v-tab>
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
    const showProfile = (institutionId: number) => {
      router.push({
        name: AESTRoutesConst.PROFILE,
      });
    };

    onMounted(async () => {
      initialValue.value = await InstitutionService.shared.getBasicInstitutionInfoById(
        props.institutionId,
      );
    });
    return {
      initialValue,
      showProfile,
      goBack,
    };
  },
};
</script>
