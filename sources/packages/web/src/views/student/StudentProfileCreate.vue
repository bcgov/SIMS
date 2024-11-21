<template>
  <!-- During account creation, there is no existing student profile and hence no student banners are required. -->
  <student-page-container>
    <template #header>
      <div class="text-center">
        <p class="category-header-x-large">Create Your Profile</p>
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
import { ref, onMounted, defineComponent } from "vue";
import { useRouter } from "vue-router";
import {
  useSnackBar,
  useAuthBCSC,
  useFormatters,
  useStudentStore,
  useAuthBCeID,
  useFormioUtils,
} from "@/composables";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { StudentService } from "@/services/StudentService";
import { StudentAccountApplicationService } from "@/services/StudentAccountApplicationService";
import { CreateStudentAPIInDTO } from "@/services/http/dto/Student.dto";
import {
  ApiProcessError,
  IdentityProviders,
  FormIOForm,
  StudentProfileFormModel,
  StudentProfileFormModes,
} from "@/types";
import { AuthService } from "@/services/AuthService";
import StudentProfileForm from "@/components/common/StudentProfileForm.vue";
import { STUDENT_ACCOUNT_APPLICATION_USER_ALREADY_EXISTS } from "@/constants";

export default defineComponent({
  components: {
    StudentProfileForm,
  },
  setup() {
    const router = useRouter();
    const snackBar = useSnackBar();
    const { excludeExtraneousValues } = useFormioUtils();
    const initialData = ref({} as StudentProfileFormModel);
    const { bcscParsedToken } = useAuthBCSC();
    const { bceidParsedToken } = useAuthBCeID();
    const { dateOnlyLongString } = useFormatters();
    const studentStore = useStudentStore();
    const processing = ref(false);

    const getStudentDetails = async () => {
      const data = {
        mode: StudentProfileFormModes.StudentCreate,
        identityProvider: AuthService.shared.userToken?.identityProvider,
      } as StudentProfileFormModel;
      if (
        AuthService.shared.userToken?.identityProvider ===
        IdentityProviders.BCSC
      ) {
        data.firstName = bcscParsedToken.givenNames;
        data.lastName = bcscParsedToken.lastName;
        data.email = bcscParsedToken.email;
        data.dateOfBirth = dateOnlyLongString(bcscParsedToken.birthdate);
      } else if (
        AuthService.shared.userToken?.identityProvider ===
        IdentityProviders.BCeIDBoth
      ) {
        data.email = bceidParsedToken.email;
      }
      initialData.value = data;
    };

    onMounted(getStudentDetails);

    const submitted = async (form: FormIOForm<CreateStudentAPIInDTO>) => {
      try {
        processing.value = true;
        if (
          AuthService.shared.userToken?.identityProvider ===
          IdentityProviders.BCSC
        ) {
          // BCSC users can create their own accounts.
          const typedData = excludeExtraneousValues(
            CreateStudentAPIInDTO,
            form.data,
          );
          await StudentService.shared.createStudent(typedData);
          await Promise.all([
            studentStore.setHasStudentAccount(true),
            studentStore.updateProfileData(),
          ]);
          snackBar.success("Student was successfully created!");
          router.push({ name: StudentRoutesConst.STUDENT_DASHBOARD });
        } else if (
          AuthService.shared.userToken?.identityProvider ===
          IdentityProviders.BCeIDBoth
        ) {
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
          error.errorType === STUDENT_ACCOUNT_APPLICATION_USER_ALREADY_EXISTS
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
});
</script>
