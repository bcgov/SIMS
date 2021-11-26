<template>
  <h5 class="text-muted">
    <a @click="goBack()">
      <v-icon left> mdi-arrow-left </v-icon> Back to Institution</a
    >
  </h5>
  <full-page-container>
    <p class="category-header-large color-blue">
      {{ initialValue.operatingName }}
      <designation-status-badge
        class="mb-4 ml-4"
        designationStatus="DESIGNATED"
      />
    </p>
    <!-- TODO: Replace v-btn with vuetify2 equivalent v-tab with icon once veutify3 is released-->
    <v-btn
      text
      variant="outlined"
      @click="showData(AESTRoutesConst.INSTITUTION_PROFILE)"
      ><v-icon size="25" class="mr-2">mdi-city</v-icon>Profile</v-btn
    >
    <v-btn
      text
      variant="outlined"
      @click="showData(AESTRoutesConst.INSTITUTION_PROGRAMS)"
    >
      <v-icon size="25" class="mr-2">mdi-book-open-outline</v-icon
      >Programs</v-btn
    >
    <v-btn
      text
      variant="outlined"
      @click="showData(AESTRoutesConst.INSTITUTION_LOCATIONS)"
      ><v-icon size="25" class="mr-2">mdi-map-marker-outline</v-icon
      >Locations</v-btn
    >
    <v-btn
      text
      variant="outlined"
      @click="showData(AESTRoutesConst.INSTITUTION_USERS)"
      ><v-icon size="25" class="mr-2">mdi-account-group-outline</v-icon
      >Users</v-btn
    >
    <v-btn
      text
      variant="outlined"
      @click="showData(AESTRoutesConst.INSTITUTION_DESIGNATION)"
      ><v-icon size="25" class="mr-2">mdi-certificate-outline</v-icon
      >Designation</v-btn
    >
    <v-btn
      text
      variant="outlined"
      @click="showData(AESTRoutesConst.INSTITUTION_RESTRICTIONS)"
      ><v-icon size="25" class="mr-2">mdi-close-circle-outline</v-icon
      >Restrictions</v-btn
    >
    <v-btn
      text
      variant="outlined"
      @click="showData(AESTRoutesConst.INSTITUTION_NOTES)"
      ><v-icon size="25" class="mr-2">mdi-clipboard-outline</v-icon>Notes</v-btn
    >
    <hr />
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </full-page-container>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { InstitutionService } from "@/services/InstitutionService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import DesignationStatusBadge from "@/components/generic/DesignationStatusBadge.vue";
import { BasicInstitutionInfo } from "@/types";
export default {
  components: { FullPageContainer, DesignationStatusBadge },
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
    const showData = (routeName: symbol) => {
      router.push({
        name: routeName,
        params: { institutionId: props.institutionId },
      });
    };
    onMounted(async () => {
      initialValue.value = await InstitutionService.shared.getBasicInstitutionInfoById(
        props.institutionId,
      );
      showData(AESTRoutesConst.INSTITUTION_PROFILE);
    });
    return {
      initialValue,
      showData,
      goBack,
      AESTRoutesConst,
    };
  },
};
</script>
