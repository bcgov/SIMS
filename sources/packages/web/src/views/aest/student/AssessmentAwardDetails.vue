<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Financial Aid Application"
        subTitle="View Assessment"
        :routeLocation="{
          name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
          params: { applicationId, studentId },
        }"
      />
    </template>
    <body-header
      title="Summary"
      subTitle="Below is the summary from your assessment. To view your entire assessment, click on View assessment."
    >
      <template #actions>
        <v-btn
          class="float-right"
          color="primary"
          @click="goToNoticeOfAssessment"
          >View assessment</v-btn
        >
      </template>
    </body-header>
    <v-row>
      <v-col>
        <content-group>
          <div class="category-header-medium primary-color my-3">
            Estimated award
          </div>
          <v-table class="bordered">
            <thead>
              <tr>
                <th class="text-left">Name</th>
                <th class="text-left">Calories</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in desserts" :key="item.name">
                <td>
                  {{ item.name }}
                  <tooltip-icon :content="item.name" />
                </td>
                <td>{{ item.calories }}</td>
              </tr>
            </tbody>
          </v-table>
          <div class="my-3">
            <v-icon
              icon="fa:fas fa-check-circle"
              color="success"
              class="check-circle-small"
            />
            Enrolment confirmed
          </div>
          <div class="my-3">
            <v-icon
              icon="fa:fas fa-check-circle"
              color="success"
              class="check-circle-small"
            />
            Tuition remittance applied <span class="label-bold">-$1000</span>
          </div>
          <content-group-info>
            <div>
              <span class="label-bold">Earliest date of disbursement: </span>
              <span>Sep 01 2022</span>
            </div>
            <div>
              <span class="label-bold">Certificate number: </span>
              <span>12345678</span>
            </div>
          </content-group-info>
        </content-group>
      </v-col>
      <v-col>
        <content-group>
          <div class="category-header-medium primary-color my-3">
            Final award
          </div>
          <v-table class="bordered">
            <thead>
              <tr>
                <th class="text-left">Name</th>
                <th class="text-left">Calories</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in desserts" :key="item.name">
                <td>
                  {{ item.name }}
                  <tooltip-icon :content="item.name" />
                </td>
                <td>{{ item.calories }}</td>
              </tr>
            </tbody>
          </v-table></content-group
        >
      </v-col>
    </v-row>
  </full-page-container>
</template>
<script lang="ts">
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { ref } from "vue";
import TooltipIcon from "@/components/generic/TooltipIcon.vue";

export default {
  components: { TooltipIcon },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
    assessmentId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const desserts = ref([
      {
        name: "Frozen Yogurt",
        calories: 159,
      },
      {
        name: "Ice cream sandwich",
        calories: 237,
      },
      {
        name: "Eclair",
        calories: 262,
      },
      {
        name: "Cupcake",
        calories: 305,
      },
    ]);

    const goToNoticeOfAssessment = () => {
      return router.push({
        name: AESTRoutesConst.NOTICE_OF_ASSESSMENT_VIEW,
        params: {
          studentId: props.studentId,
          applicationId: props.applicationId,
          assessmentId: props.assessmentId,
        },
      });
    };

    return { AESTRoutesConst, goToNoticeOfAssessment, desserts };
  },
};
</script>
