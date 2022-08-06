<template>
  <full-page-container>
    <template #header>
      <header-navigator title="Accounts" subTitle="View request">
        <template #buttons>
          <v-row class="p-0 m-0">
            <v-btn color="primary" class="mr-2" variant="outlined"
              >Deny request</v-btn
            >
            <v-btn color="primary" outline>Create account for student</v-btn>
          </v-row>
        </template>
      </header-navigator>
    </template>
    <student-profile-form :processing="processing" :formModel="initialData" />
  </full-page-container>
</template>

<script lang="ts">
import { ref, onMounted } from "vue";
import {
  StudentProfileFormModel,
  StudentProfileFormModes,
} from "@/types/contracts/StudentContract";
import StudentProfileForm from "@/components/common/StudentProfileForm.vue";
import { StudentAccountApplicationService } from "@/services/StudentAccountApplicationService";
import { AppIDPType } from "@/types";

export default {
  components: {
    StudentProfileForm,
  },
  props: {
    studentAccountApplicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const initialData = ref({} as StudentProfileFormModel);
    const processing = ref(false);

    const getStudentDetails = async () => {
      const accountApplication =
        await StudentAccountApplicationService.shared.getStudentAccountApplicationById(
          props.studentAccountApplicationId,
        );
      const studentProfileFormModel =
        accountApplication.submittedData as StudentProfileFormModel;
      studentProfileFormModel.identityProvider = AppIDPType.BCeID;
      studentProfileFormModel.mode =
        StudentProfileFormModes.AESTAccountApproval;
      initialData.value = studentProfileFormModel;
    };

    onMounted(getStudentDetails);

    return {
      initialData,
      processing,
    };
  },
};
</script>
