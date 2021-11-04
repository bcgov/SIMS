<template>
  <v-container>
    <h5 class="text-muted">
      <a @click="goBack()">
        <v-icon left> mdi-arrow-left </v-icon> Back to Students</a
      >
    </h5>
    <h2 class="color-blue">Student</h2>
    <!-- <h2 class="mt-2">Student Applications are Progress</h2> -->
    <v-card>
      <v-card-title>Student Profile</v-card-title>
      <v-card-text>
        <v-row>
          <v-col>GivenName</v-col>
          <v-col>LastName</v-col>
          <v-col>Email</v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-title>Applications</v-card-title>
      <v-card-text>
        <v-row>
          <v-col>Hello</v-col>
          <v-col>HI</v-col>
          <v-col>How are you</v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-col>
      <DataTable
        :autoLayout="true"
        :value="studentDetail.applications"
        class="p-m-4"
      >
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
  </v-container>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { StudentDetail, ApplicationStatus } from "@/types";
import { AestService } from "@/services/AestService";
import { useFormatters } from "@/composables";
import Status from "@/views/student/ApplicationStatus.vue";
export default {
  components: { Status },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const studentDetail = ref({} as StudentDetail);
    const { dateString } = useFormatters();
    const goBack = () => {
      router.push({
        name: AESTRoutesConst.SEARCH_STUDENTS,
      });
    };

    onMounted(async () => {
      studentDetail.value = await AestService.shared.getStudentDetail(
        props.studentId,
      );
    });

    const goToApplication = (id: number) => {
      return router.push({
        name: AESTRoutesConst.APPLICATION_DETAILS,
        params: {
          applicationId: id,
        },
      });
    };
    return {
      goBack,
      goToApplication,
      studentDetail,
      dateString,
      ApplicationStatus,
    };
  },
};
</script>
