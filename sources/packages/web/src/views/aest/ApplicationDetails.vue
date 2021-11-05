<template>
  <h5 class="text-muted">
    <a @click="goBack()">
      <v-icon left> mdi-arrow-left </v-icon> Back to Student Details</a
    >
  </h5>
  <full-page-container v-if="applicationDetail.data">
    <h2 class="color-blue padding-bottom-30">
      Student Application Details
      {{
        applicationDetail.applicationNumber
          ? " - " + applicationDetail.applicationNumber
          : ""
      }}
    </h2>
    <formio
      :formName="selectedForm"
      :data="initialData"
      :readOnly="true"
    ></formio>
  </full-page-container>
</template>
<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { GetApplicationDataDto } from "@/types";
import { AestService } from "@/services/AestService";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import formio from "@/components/generic/formio.vue";
export default {
  components: { FullPageContainer, formio },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const applicationDetail = ref({} as GetApplicationDataDto);
    const initialData = ref({});
    const selectedForm = ref();
    onMounted(async () => {
      applicationDetail.value = await AestService.shared.getApplicationDetail(
        props.applicationId,
        props.studentId,
      );
      selectedForm.value = applicationDetail.value.applicationFormName;
      initialData.value = applicationDetail.value.data;
    });

    const goBack = () => {
      router.push({
        name: AESTRoutesConst.STUDENT_DETAILS,
        params: {
          studentId: props.studentId,
        },
      });
    };
    return {
      applicationDetail,
      initialData,
      selectedForm,
      goBack,
    };
  },
};
</script>
