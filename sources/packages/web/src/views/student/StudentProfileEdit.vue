<template>
  <student-page-container>
    <template #header>
      <header-navigator title="Student" sub-title="Profile" />
    </template>
    <student-profile-form
      :processing="processing"
      :form-model="initialData"
      :is-data-ready="isDataReady"
      @submitted="submitted"
      @custom-event="showPDApplicationModal"
    />
  </student-page-container>
  <p-d-status-application-modal ref="pdStatusApplicationModal" />
</template>

<script lang="ts">
import { ref, onMounted, defineComponent } from "vue";
import { useRouter } from "vue-router";
import {
  ModalDialog,
  useFormioUtils,
  useSnackBar,
  useFormatters,
} from "@/composables";
import {
  StudentProfileFormModel,
  StudentProfileFormModes,
} from "@/types/contracts/StudentContract";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import PDStatusApplicationModal from "@/components/students/modals/PDStatusApplicationModal.vue";
import { StudentService } from "@/services/StudentService";
import { UpdateStudentAPIInDTO } from "@/services/http/dto/Student.dto";
import { AuthService } from "@/services/AuthService";
import { ApiProcessError, FormIOForm } from "@/types";
import StudentProfileForm from "@/components/common/StudentProfileForm.vue";
import { DISABILITY_REQUEST_NOT_ALLOWED } from "@/constants";

export default defineComponent({
  components: {
    StudentProfileForm,
    PDStatusApplicationModal,
  },
  setup() {
    const router = useRouter();
    const snackBar = useSnackBar();
    const { excludeExtraneousValues } = useFormioUtils();
    const { disabilityStatusToDisplay, modifiedIndependentStatusToDisplay } =
      useFormatters();
    const initialData = ref({} as StudentProfileFormModel);
    const pdStatusApplicationModal = ref({} as ModalDialog<boolean>);
    const processing = ref(false);
    const isDataReady = ref(false);

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
        disabilityStatus: disabilityStatusToDisplay(
          studentInfo.disabilityStatus,
        ),
        modifiedIndependentStatus: modifiedIndependentStatusToDisplay(
          studentInfo.modifiedIndependentStatus,
        ),
      };
      initialData.value = data;
      isDataReady.value = true;
    };

    onMounted(getStudentDetails);

    const applyPDStatus = async () => {
      try {
        await StudentService.shared.applyForDisabilityStatus();
        snackBar.success(
          "Your application is submitted. The outcome will display on your profile",
        );
      } catch (error: unknown) {
        if (
          error instanceof ApiProcessError &&
          error.errorType === DISABILITY_REQUEST_NOT_ALLOWED
        ) {
          snackBar.error(`${error.message}`);
          return;
        }
        snackBar.error(
          "Unexpected error while applying for disability status. Please try after sometime.",
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
      isDataReady,
    };
  },
});
</script>
