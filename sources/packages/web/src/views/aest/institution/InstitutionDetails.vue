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
      showNotes(props.institutionId);
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
