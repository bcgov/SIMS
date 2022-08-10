<template>
  <student-page-container>
    <template #header>
      <header-navigator title="Student" subTitle="Profile" />
    </template>
    <student-profile-form
      :processing="processing"
      :formModel="initialData"
      @submitted="submitted"
      @customEvent="showPDApplicationModal"
    />
  </student-page-container>
  <p-d-status-application-modal
    max-width="600"
    ref="pdStatusApplicationModal"
  />
</template>

<script lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ModalDialog, useSnackBar } from "@/composables";
import {
  StudentPDStatus,
  StudentProfileFormModel,
  StudentProfileFormModes,
} from "@/types/contracts/StudentContract";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import PDStatusApplicationModal from "@/components/students/modals/PDStatusApplicationModal.vue";
import { StudentService } from "@/services/StudentService";
import { UpdateStudentAPIInDTO } from "@/services/http/dto/Student.dto";
import { AuthService } from "@/services/AuthService";
import { FormIOForm } from "@/types";
import StudentProfileForm from "@/components/common/StudentProfileForm.vue";

export default {
  components: {
    StudentProfileForm,
    PDStatusApplicationModal,
  },
  setup() {
    const router = useRouter();
    const snackBar = useSnackBar();
    const initialData = ref({} as StudentProfileFormModel);
    const pdStatusApplicationModal = ref({} as ModalDialog<boolean>);
    const processing = ref(false);

    const getStudentDetails = async () => {
      const studentInfo = await StudentService.shared.getStudentProfile();
      const data: StudentProfileFormModel = {
        ...studentInfo,
        ...studentInfo.contact.address,
        phone: studentInfo.contact.phone,
        firstName: studentInfo.firstName,
        dateOfBirth: studentInfo.birthDateFormatted,
        mode: StudentProfileFormModes.StudentEdit,
        identityProvider: AuthService.shared.userToken?.IDP,
      };
      initialData.value = data;
    };

    onMounted(getStudentDetails);

    const applyPDStatus = async () => {
      try {
        await StudentService.shared.applyForPDStatus();
        snackBar.success(
          "Your application is submitted. The outcome will display on your profile",
        );
      } catch (error) {
        snackBar.error(
          "An error happened during the apply PD process. Please try after sometime.",
        );
      }
      await getStudentDetails();
    };

    const showPDApplicationModal = async () => {
      if (await pdStatusApplicationModal.value.showModal()) {
        await applyPDStatus();
      }
    };

    const submitted = async (form: FormIOForm<UpdateStudentAPIInDTO>) => {
      try {
        processing.value = true;
        await StudentService.shared.updateStudent(form.data);
        snackBar.success("Student contact information updated!");
        router.push({ name: StudentRoutesConst.STUDENT_DASHBOARD });
      } catch {
        snackBar.error("Error while saving student");
      } finally {
        processing.value = false;
      }
    };

    return {
      submitted,
      initialData,
      applyPDStatus,
      pdStatusApplicationModal,
      showPDApplicationModal,
      processing,
    };
  },
};
</script>
