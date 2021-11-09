<template>
  <h5 class="text-muted">
    <a @click="goBack()">
      <v-icon left> mdi-arrow-left </v-icon> Back to Student Search</a
    >
  </h5>
  <PDStatus :pdStatus="studentDetail.pdStatus" />
  <full-page-container>
    <h2 class="color-blue pb-4">Student Details</h2>
    <formio formName="studentProfileSummary" :data="initialData"></formio>
    <div class="category-header-large">Student Appliations</div>
    <v-col>
      <DataTable :autoLayout="true" :value="applications" class="p-m-4">
        <Column field="applicationNumber" header="Application #"> </Column>
        <Column field="applicationName" header="Study Period">
          <template #body="slotProps">
            <v-btn
              plain
              color="primary"
              @click="goToApplication(slotProps.data.id)"
              >{{ slotProps.data.applicationName }}</v-btn
            >
          </template></Column
        >
        <Column field="studyStartPeriod" header="Study Period">
          <template #body="slotProps">
            <span>
              {{ dateString(slotProps.data.studyStartPeriod) }} -
              {{ dateString(slotProps.data.studyEndPeriod) }}
            </span>
          </template></Column
        >
        <Column field="award" header="Award"></Column>
        <Column field="status" header="Status">
          <template #body="slotProps">
            <Status :statusValue="slotProps.data.status" />
          </template>
        </Column>
      </DataTable>
    </v-col>
  </full-page-container>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import {
  StudentDetail,
  ApplicationStatus,
  ApplicationSummaryDTO,
} from "@/types";
import { StudentService } from "@/services/StudentService";
import { ApplicationService } from "@/services/ApplicationService";
import { useFormatters } from "@/composables";
import Status from "@/views/student/ApplicationStatus.vue";
import PDStatus from "@/views/student/StudentPDBanner.vue";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import formio from "@/components/generic/formio.vue";
export default {
  components: { Status, FullPageContainer, PDStatus, formio },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const studentDetail = ref({} as StudentDetail);
    const applications = ref({} as ApplicationSummaryDTO[]);
    const initialData = ref();
    const { dateString, dateOnlyLongString } = useFormatters();
    const goBack = () => {
      router.push({
        name: AESTRoutesConst.SEARCH_STUDENTS,
      });
    };

    onMounted(async () => {
      const [student, studentApplications] = await Promise.all([
        StudentService.shared.getStudentDetail(props.studentId),
        ApplicationService.shared.getAllApplicationsForStudent(props.studentId),
      ]);
      studentDetail.value = student;
      applications.value = studentApplications;

      initialData.value = {
        firstName: studentDetail.value.firstName,
        lastName: studentDetail.value.lastName,
        gender: studentDetail.value.gender,
        email: studentDetail.value.email,
        dateOfBirth: dateOnlyLongString(studentDetail.value.dateOfBirth),
        phone: studentDetail.value.contact.phone,
        addressLine1: studentDetail.value.contact.addressLine1,
        addressLine2: studentDetail.value.contact.addressLine2,
        city: studentDetail.value.contact.city,
        provinceState: studentDetail.value.contact.provinceState,
        postalCode: studentDetail.value.contact.postalCode,
      };
    });

    const goToApplication = (id: number) => {
      return router.push({
        name: AESTRoutesConst.APPLICATION_DETAILS,
        params: {
          applicationId: id,
          studentId: props.studentId,
        },
      });
    };
    return {
      goBack,
      goToApplication,
      studentDetail,
      dateString,
      ApplicationStatus,
      initialData,
      applications,
    };
  },
};
</script>
