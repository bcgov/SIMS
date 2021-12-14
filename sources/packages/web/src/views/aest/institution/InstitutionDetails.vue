<template>
  <h5 class="text-muted">
    <a @click="goBack()">
      <v-icon left> mdi-arrow-left </v-icon> Back to Institution</a
    >
  </h5>
  <full-page-container>
    <p class="category-header-large color-blue">
      {{ institutionBasicDetail.operatingName }}
      <designation-status-badge
        class="mb-4 ml-4"
        designationStatus="DESIGNATED"
      />
    </p>
    <!-- TODO:replace prime tabMenu with vuetify3-->
    <TabMenu :model="items" />
    <router-view />
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
    const institutionBasicDetail = ref({} as BasicInstitutionInfo);
    const items = ref([
      {
        label: "Profile",
        icon: "fa fa-university",
        command: () => {
          router.push({
            name: AESTRoutesConst.INSTITUTION_PROFILE,
            params: { institutionId: props.institutionId },
          });
        },
      },
      {
        label: "Programs",
        icon: "fa fa-book",
        command: () => {
          router.push({
            name: AESTRoutesConst.INSTITUTION_PROGRAMS,
            params: { institutionId: props.institutionId },
          });
        },
      },
      {
        label: "Locations",
        icon: "fa fa-map-marker",
        command: () => {
          router.push({
            name: AESTRoutesConst.INSTITUTION_LOCATIONS,
            params: { institutionId: props.institutionId },
          });
        },
      },
      {
        label: "Users",
        icon: "fa fa-users",
        command: () => {
          router.push({
            name: AESTRoutesConst.INSTITUTION_USERS,
            params: { institutionId: props.institutionId },
          });
        },
      },
      {
        label: "Designation",
        icon: "fa fa-pencil",
        command: () => {
          router.push({
            name: AESTRoutesConst.INSTITUTION_DESIGNATION,
            params: { institutionId: props.institutionId },
          });
        },
      },
      {
        label: "Restrictions",
        icon: "fa fa-window-close",
        command: () => {
          router.push({
            name: AESTRoutesConst.INSTITUTION_RESTRICTIONS,
            params: { institutionId: props.institutionId },
          });
        },
      },
      {
        label: "Notes",
        icon: "fa fa-sticky-note-o",

        command: () => {
          router.push({
            name: AESTRoutesConst.INSTITUTION_NOTES,
            params: { institutionId: props.institutionId },
          });
        },
      },
    ]);

    const goBack = () => {
      router.push({
        name: AESTRoutesConst.SEARCH_INSTITUTIONS,
      });
    };

    onMounted(async () => {
      institutionBasicDetail.value = await InstitutionService.shared.getBasicInstitutionInfoById(
        props.institutionId,
      );
    });
    return {
      institutionBasicDetail,
      goBack,
      AESTRoutesConst,
      items,
    };
  },
};
</script>
