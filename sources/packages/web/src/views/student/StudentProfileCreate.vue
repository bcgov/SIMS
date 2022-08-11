<template>
  <student-page-container>
    <template #header>
      <div class="text-center">
        <p class="category-header-x-large">Create Your Profile</p>
        <p>
          Use your most up-to-date personal information.<br />
          We'll use the same information to help you apply for financial aid.
        </p>
      </div>
    </template>
    <student-profile-form
      :formModel="initialData"
      @submitted="submitted"
      :processing="processing"
    />
  </student-page-container>
</template>

<script lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  useSnackBar,
  useAuthBCSC,
  useFormatters,
  useStudentStore,
  useAuthBCeID,
} from "@/composables";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { StudentService } from "@/services/StudentService";
import { StudentAccountApplicationService } from "@/services/StudentAccountApplicationService";
import { CreateStudentAPIInDTO } from "@/services/http/dto/Student.dto";
import {
  ApiProcessError,
  AppIDPType,
  FormIOForm,
  StudentProfileFormModel,
  StudentProfileFormModes,
} from "@/types";
import { AuthService } from "@/services/AuthService";
import StudentProfileForm from "@/components/common/StudentProfileForm.vue";
import { STUDENT_ACCOUNT_APPLICATION_USER_ALREADY_EXITS } from "@/constants";

export default {
  components: {
    StudentProfileForm,
  },
  setup() {
    const router = useRouter();
    const snackBar = useSnackBar();
    const initialData = ref({} as StudentProfileFormModel);
    const { bcscParsedToken } = useAuthBCSC();
    const { bceidParsedToken } = useAuthBCeID();
    const { dateOnlyLongString } = useFormatters();
    const studentStore = useStudentStore();
    const processing = ref(false);

    const getStudentDetails = async () => {
      const data = {
        mode: StudentProfileFormModes.StudentCreate,
        identityProvider: AuthService.shared.userToken?.IDP,
      } as StudentProfileFormModel;
      if (AuthService.shared.userToken?.IDP === AppIDPType.BCSC) {
        data.firstName = bcscParsedToken.givenNames;
        data.lastName = bcscParsedToken.lastName;
        data.email = bcscParsedToken.email;
        data.gender = bcscParsedToken.gender;
        data.dateOfBirth = dateOnlyLongString(bcscParsedToken.birthdate);
      } else if (AuthService.shared.userToken?.IDP === AppIDPType.BCeID) {
        data.email = bceidParsedToken.email;
      }
      initialData.value = data;
    };

    onMounted(getStudentDetails);

    const submitted = async (form: FormIOForm<CreateStudentAPIInDTO>) => {
      try {
        processing.value = true;
        if (AuthService.shared.userToken?.IDP === AppIDPType.BCSC) {
          // BCSC users can create their own accounts.
          await StudentService.shared.createStudent(form.data);
          await Promise.all([
            studentStore.setHasStudentAccount(true),
            studentStore.updateProfileData(),
          ]);
          snackBar.success("Student was successfully created!");
          router.push({ name: StudentRoutesConst.STUDENT_DASHBOARD });
        } else if (AuthService.shared.userToken?.IDP === AppIDPType.BCeID) {
          // BCeID users must have an identity verification executed by the Ministry.
          // A request will be sent to a Ministry user assess the data provided.
          await StudentAccountApplicationService.shared.createStudentAccountApplication(
            { submittedData: form.data },
          );
          snackBar.success("Your profile was successfully created.");
          router.push({
            name: StudentRoutesConst.STUDENT_ACCOUNT_APPLICATION_IN_PROGRESS,
          });
        }
      } catch (error: unknown) {
        if (
          error instanceof ApiProcessError &&
          error.errorType === STUDENT_ACCOUNT_APPLICATION_USER_ALREADY_EXITS
        ) {
          snackBar.error("The user has been used in a previous request.");
        } else {
          snackBar.error("Error while saving student.");
        }
      } finally {
        processing.value = false;
      }
    };

    return {
      submitted,
      initialData,
      processing,
    };
  },
};
</script>
