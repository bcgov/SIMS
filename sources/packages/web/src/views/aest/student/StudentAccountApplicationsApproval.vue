<template>
  <full-page-container>
    <template #header>
      <header-navigator title="Accounts" subTitle="View request">
        <template #buttons>
          <v-row class="p-0 m-0">
            <v-btn
              color="primary"
              class="mr-2"
              variant="outlined"
              @click="declineStudentAccount"
              >Deny request</v-btn
            >
            <v-btn color="primary" outline @click="createStudentAccount"
              >Create account for student</v-btn
            >
          </v-row>
        </template>
      </header-navigator>
    </template>
    <student-profile-form
      :processing="processing"
      :formModel="initialData"
      @loaded="formLoaded"
    />
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
import { AppIDPType, FormIOForm } from "@/types";
import { StudentAccountApplicationApprovalAPIInDTO } from "@/services/http/dto";
import { useFormioUtils, useSnackBar } from "@/composables";

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
    const snackBar = useSnackBar();
    let formIOForm: FormIOForm<StudentAccountApplicationApprovalAPIInDTO>;
    const { checkFormioValidity } = useFormioUtils();
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

    const formLoaded = (
      form: FormIOForm<StudentAccountApplicationApprovalAPIInDTO>,
    ) => {
      // Saves the form.io reference for later use.
      formIOForm = form;
    };

    const createStudentAccount = async () => {
      if (checkFormioValidity([formIOForm])) {
        try {
          processing.value = true;
          await StudentAccountApplicationService.shared.approveStudentAccountApplication(
            props.studentAccountApplicationId,
            formIOForm.data,
          );
          snackBar.success(
            "Student account application approved and student account created.",
          );
        } catch {
          snackBar.error(
            "Unexpected error while approving the student account application.",
          );
        } finally {
          processing.value = false;
        }
      }
    };

    const declineStudentAccount = async () => {
      try {
        processing.value = true;
        await StudentAccountApplicationService.shared.declineStudentAccountApplication(
          props.studentAccountApplicationId,
        );
        snackBar.success("Student account application declined.");
      } catch {
        snackBar.error(
          "Unexpected error while declining the student account application.",
        );
      } finally {
        processing.value = false;
      }
    };

    return {
      initialData,
      processing,
      formLoaded,
      createStudentAccount,
      declineStudentAccount,
    };
  },
};
</script>
