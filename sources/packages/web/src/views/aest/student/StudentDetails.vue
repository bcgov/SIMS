<template>
  <p class="text-muted category-header-medium">
    Student Details
  </p>
  <p class="category-header-large">
    {{ studentDetails.firstName }} {{ studentDetails.lastName }}
    <designation-and-restriction-status-badge
      class="mb-4 ml-4"
      :status="
        restrictions.hasRestriction
          ? DesignationAndRestrictionStatus.restriction
          : DesignationAndRestrictionStatus.noRestriction
      "
    />
  </p>
  <!-- TODO:replace prime tabMenu with vuetify3-->
  <TabMenu :model="items" />
  <router-view />
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { StudentService } from "@/services/StudentService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import DesignationAndRestrictionStatusBadge from "@/components/generic/DesignationAndRestrictionStatusBadge.vue";
import {
  StudentDetail,
  StudentRestrictionStatus,
  DesignationAndRestrictionStatus,
} from "@/types";

export default {
  components: { DesignationAndRestrictionStatusBadge },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const studentDetails = ref({} as StudentDetail);
    const restrictions = ref({} as StudentRestrictionStatus);
    // TODO: replace all fa icons with fas as per figma with replace with vuetify3
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
      const [restriction, studentDetail] = await Promise.all([
        StudentService.shared.getStudentRestriction(),
        StudentService.shared.getStudentDetail(props.studentId),
      ]);
      restrictions.value = restriction;
      studentDetails.value = studentDetail;
    });
    return {
      goBack,
      AESTRoutesConst,
      items,
      restrictions,
      studentDetails,
      DesignationAndRestrictionStatus,
    };
  },
};
</script>
