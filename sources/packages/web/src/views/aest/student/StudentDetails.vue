<template>
  <p class="text-muted category-header-medium">
    Student Details
  </p>
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
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { InstitutionService } from "@/services/InstitutionService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import DesignationStatusBadge from "@/components/generic/DesignationStatusBadge.vue";
import { BasicInstitutionInfo } from "@/types";
export default {
  components: { DesignationStatusBadge },
  props: {
    studentId: {
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
        icon: "fa fa-id-card-o",
        command: () => {
          router.push({
            name: AESTRoutesConst.STUDENT_PROFILE,
            params: { studentId: props.studentId },
          });
        },
      },
      {
        label: "Applications",
        icon: "fa fa-folder-o",
        command: () => {
          router.push({
            name: AESTRoutesConst.STUDENT_APPLICATIONS,
            params: { studentId: props.studentId },
          });
        },
      },
      {
        label: "Restrictions",
        icon: "fa fa-map-marker",
        command: () => {
          router.push({
            name: AESTRoutesConst.STUDENT_RESTRICTION,
            params: { studentId: props.studentId },
          });
        },
      },
      {
        label: "Notes",
        icon: "fa fa-sticky-note-o",

        command: () => {
          router.push({
            name: AESTRoutesConst.STUDENT_NOTES,
            params: { studentId: props.studentId },
          });
        },
      },
    ]);

    const goBack = () => {
      router.push({
        name: AESTRoutesConst.SEARCH_STUDENTS,
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
