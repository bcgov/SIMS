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
  <p-d-status-application-modal ref="pdStatusApplicationModal" />
</template>

<script lang="ts">
import { ref, onMounted, defineComponent } from "vue";
import { useRouter } from "vue-router";
import { ModalDialog, useFormioUtils, useSnackBar } from "@/composables";
import {
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

export default defineComponent({
  components: {
    StudentProfileForm,
    PDStatusApplicationModal,
  },
  setup() {
    const router = useRouter();
    const snackBar = useSnackBar();
    const { excludeExtraneousValues } = useFormioUtils();
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
        identityProvider: AuthService.shared.userToken?.identityProvider,
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
      } catch {
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
        const typedData = excludeExtraneousValues(
          UpdateStudentAPIInDTO,
          form.data,
        );
        await StudentService.shared.updateStudent(typedData);
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
});
</script>
