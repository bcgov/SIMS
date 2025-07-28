<template>
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

    const populateBcscAddressFields = (data: StudentProfileFormModel) => {
      if (!bcscParsedToken.address) return;

      if (bcscParsedToken.address.street_address) {
        const normalizedAddress =
          bcscParsedToken.address.street_address.replace(/\\n/g, "\n");
        const addressParts = normalizedAddress.split("\n");
        data.addressLine1 = addressParts[0];
        if (addressParts.length > 1) {
          data.addressLine2 = addressParts.slice(1).join("\n");
        }
      }
      if (bcscParsedToken.address.locality) {
        data.city = bcscParsedToken.address.locality;
      }
      if (bcscParsedToken.address.region) {
        data.provinceState = bcscParsedToken.address.region;
      }
      if (bcscParsedToken.address.postal_code) {
        data.canadaPostalCode = bcscParsedToken.address.postal_code;
      }
      if (bcscParsedToken.address.country) {
        data.country = bcscParsedToken.address.country;
        data.selectedCountry =
          bcscParsedToken.address.country.toLowerCase() === "ca" ||
          bcscParsedToken.address.country.toLowerCase() === "canada"
            ? "Canada"
            : "other";
      }
    };

    const populateBcscUserData = (data: StudentProfileFormModel) => {
      data.firstName = bcscParsedToken.givenNames;
      data.lastName = bcscParsedToken.lastName;
      data.email = bcscParsedToken.email;
      data.dateOfBirth = dateOnlyLongString(bcscParsedToken.birthdate);
      populateBcscAddressFields(data);
    };

    const populateBasicUserData = (data: StudentProfileFormModel) => {
      data.email = bceidParsedToken.email;
    };

    const getStudentDetails = async () => {
      const data = {
        mode: StudentProfileFormModes.StudentCreate,
        identityProvider: AuthService.shared.userToken?.identityProvider,
      } as StudentProfileFormModel;

      const identityProvider = AuthService.shared.userToken?.identityProvider;

      if (identityProvider === IdentityProviders.BCSC) {
        populateBcscUserData(data);
      } else if (identityProvider === IdentityProviders.BCeIDBoth) {
        populateBasicUserData(data);
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
