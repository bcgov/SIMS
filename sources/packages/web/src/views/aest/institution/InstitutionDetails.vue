<template>
  <h5 class="text-muted">
    <a @click="goBack()">
      <v-icon left> mdi-arrow-left </v-icon> Back to Institution</a
    >
  </h5>
  <full-page-container>
    <h2 color="primary-color" class="mb-15">
      {{ initialValue.operatingName }}
      <designation-status-badge designationStatus="DESIGNATED" />
    </h2>
    <!-- TODO: Replace v-btn with vuetify2 equivalent v-tab with icon once veutify3 is released-->
    <v-btn text variant="outlined" @click="showProfile(institutionId)"
      ><v-icon size="25" class="mr-2">mdi-city</v-icon>Profile</v-btn
    >
    <v-btn text variant="outlined" @click="showPrograms(institutionId)">
      <v-icon size="25" class="mr-2">mdi-book-open-outline</v-icon
      >Programs</v-btn
    >
    <v-btn text variant="outlined" @click="showLocations(institutionId)"
      ><v-icon size="25" class="mr-2">mdi-map-marker-outline</v-icon
      >Locations</v-btn
    >
    <v-btn text variant="outlined" @click="showUsers(institutionId)"
      ><v-icon size="25" class="mr-2">mdi-account-group-outline</v-icon
      >Users</v-btn
    >
    <v-btn text variant="outlined" @click="showDesignation(institutionId)"
      ><v-icon size="25" class="mr-2">mdi-certificate-outline</v-icon
      >Designation</v-btn
    >
    <v-btn text variant="outlined" @click="showRestrictions(institutionId)"
      ><v-icon size="25" class="mr-2">mdi-close-circle-outline</v-icon
      >Restrictions</v-btn
    >
    <v-btn text variant="outlined" @click="showNotes(institutionId)"
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
    const showProfile = (institutionId: number) => {
      router.push({
        name: AESTRoutesConst.PROFILE,
        params: { institutionId: institutionId },
      });
    };
    const showPrograms = (institutionId: number) => {
      router.push({
        name: AESTRoutesConst.PROGRAMS,
        params: { institutionId: institutionId },
      });
    };
    const showLocations = (institutionId: number) => {
      router.push({
        name: AESTRoutesConst.LOCATIONS,
        params: { institutionId: institutionId },
      });
    };
    const showUsers = (institutionId: number) => {
      router.push({
        name: AESTRoutesConst.USERS,
        params: { institutionId: institutionId },
      });
    };
    const showDesignation = (institutionId: number) => {
      router.push({
        name: AESTRoutesConst.DESIGNATION,
        params: { institutionId: institutionId },
      });
    };
    const showRestrictions = (institutionId: number) => {
      router.push({
        name: AESTRoutesConst.RESTRICTIONS,
        params: { institutionId: institutionId },
      });
    };
    const showNotes = (institutionId: number) => {
      router.push({
        name: AESTRoutesConst.NOTES,
        params: { institutionId: institutionId },
      });
    };
    onMounted(async () => {
      initialValue.value = await InstitutionService.shared.getBasicInstitutionInfoById(
        props.institutionId,
      );
      showProfile(props.institutionId);
    });
    return {
      initialValue,
      showProfile,
      showPrograms,
      showLocations,
      showUsers,
      showDesignation,
      showRestrictions,
      showNotes,
      goBack,
    };
  },
};
</script>
