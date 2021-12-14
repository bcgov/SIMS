<template>
  <p class="text-muted category-header-medium">
    Institution Details
  </p>
  <p class="category-header-large">
    {{ institutionBasicDetail.operatingName }}
    <designation-and-restriction-status-badge
      class="mb-4 ml-4"
      status="designated"
    />
  </p>
  <!-- TODO:replace prime tabMenu with vuetify3-->
  <TabMenu :model="items" />
  <router-view />
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { InstitutionService } from "@/services/InstitutionService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import DesignationAndRestrictionStatusBadge from "@/components/generic/DesignationAndRestrictionStatusBadge.vue";
import { BasicInstitutionInfo } from "@/types";
export default {
  components: { DesignationAndRestrictionStatusBadge },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const institutionBasicDetail = ref({} as BasicInstitutionInfo);
    // TODO: replace all fa isons with fas as per figma with replace with vuetify3
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
        icon: "fa fa-times-circle-o",
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

    onMounted(async () => {
      institutionBasicDetail.value = await InstitutionService.shared.getBasicInstitutionInfoById(
        props.institutionId,
      );
    });
    return {
      institutionBasicDetail,
      AESTRoutesConst,
      items,
    };
  },
};
</script>
