<template>
  <student-page-container>
    <template #header>
      <header-navigator v-if="editMode" title="Student" subTitle="Profile" />
      <v-row v-else class="text-center">
        <v-col>
          <p class="category-header-x-large">Create Your Profile</p>
          <p>
            Use your most up-to-date personal information.<br />
            We'll use the same information to help you apply for financial aid.
          </p>
        </v-col>
      </v-row>
    </template>
    <formio-container
      formName="studentinformation"
      :formData="initialData"
      @submitted="submitted"
      @customEvent="showPDApplicationModal"
    >
      <template #actions="{ submit }">
        <footer-buttons
          :processing="processing"
          @primaryClick="submit"
          :primaryLabel="saveLabel"
          :showSecondaryButton="false"
        />
      </template>
    </formio-container>
  </student-page-container>
  <PDStatusApplicationModal max-width="600" ref="pdStatusApplicationModal" />
</template>

<script lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import {
  ModalDialog,
  useSnackBar,
  useAuthBCSC,
  useFormatters,
  useStudentStore,
  useAuthBCeID,
} from "@/composables";
import {
  StudentFormInfo,
  StudentPDStatus,
} from "@/types/contracts/StudentContract";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import PDStatusApplicationModal from "@/components/students/modals/PDStatusApplicationModal.vue";
import { StudentService } from "@/services/StudentService";
import {
  CreateStudentAPIInDTO,
  StudentProfileAPIOutDTO,
  UpdateStudentAPIInDTO,
} from "@/services/http/dto/Student.dto";
import { AddressDetailsFormAPIDTO } from "@/services/http/dto";
import { AppIDPType, FormIOForm } from "@/types";
import { AuthService } from "@/services/AuthService";

enum FormModes {
  edit = "edit",
  create = "create",
}

type StudentFormData = Pick<
  StudentProfileAPIOutDTO,
  "firstName" | "lastName" | "gender" | "email"
> &
  AddressDetailsFormAPIDTO & {
    givenNames: string;
    phone: string;
    dateOfBirth: string;
    mode: FormModes;
    identityProvider?: AppIDPType;
  };

export default {
  components: {
    PDStatusApplicationModal,
  },
  props: {
    editMode: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const snackBar = useSnackBar();
    const showApplyPDButton = ref();
    const initialData = ref({} as StudentFormData);
    const studentAllInfo = ref({} as StudentFormInfo);
    const { bcscParsedToken } = useAuthBCSC();
    const { bceidParsedToken } = useAuthBCeID();
    const { dateOnlyLongString } = useFormatters();
    const studentStore = useStudentStore();
    const pdStatusApplicationModal = ref({} as ModalDialog<boolean>);
    const processing = ref(false);

    const getStudentInfo = async () => {
      if (studentStore.hasStudentAccount.value) {
        // Avoid calling the API to get the student information if the
        // account is not created yet.
        studentAllInfo.value = await StudentService.shared.getStudentProfile();
      }
    };

    const showPendingStatus = computed(
      () => studentAllInfo.value.pdStatus === StudentPDStatus.Pending,
    );

    const saveLabel = computed(() =>
      props.editMode ? "Save profile" : "Create profile",
    );

    const getStudentDetails = async () => {
      if (props.editMode) {
        await getStudentInfo();
        const data: StudentFormData = {
          ...studentAllInfo.value,
          ...studentAllInfo.value.contact.address,
          phone: studentAllInfo.value.contact.phone,
          givenNames: studentAllInfo.value.firstName,
          dateOfBirth: studentAllInfo.value.birthDateFormatted,
          mode: FormModes.edit,
          identityProvider: AuthService.shared.userToken?.IDP,
        };
        initialData.value = data;
      } else {
        const data = {
          mode: FormModes.create,
          identityProvider: AuthService.shared.userToken?.IDP,
        } as StudentFormData;
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
      }
      await getStudentInfo();
    };

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

    const submitted = async (
      form: FormIOForm<UpdateStudentAPIInDTO | CreateStudentAPIInDTO>,
    ) => {
      try {
        processing.value = true;
        if (props.editMode) {
          await StudentService.shared.updateStudent(form.data);
          snackBar.success("Student contact information updated!");
        } else {
          await StudentService.shared.createStudent(
            form.data as CreateStudentAPIInDTO,
          );
          await Promise.all([
            studentStore.setHasStudentAccount(true),
            studentStore.updateProfileData(),
          ]);
          snackBar.success("Student was successfully created!");
        }
        router.push({ name: StudentRoutesConst.STUDENT_DASHBOARD });
      } catch {
        snackBar.error("Error while saving student");
      } finally {
        processing.value = false;
      }
    };

    onMounted(async () => {
      await getStudentDetails();
    });

    return {
      submitted,
      initialData,
      applyPDStatus,
      showApplyPDButton,
      studentAllInfo,
      showPendingStatus,
      pdStatusApplicationModal,
      showPDApplicationModal,
      processing,
      saveLabel,
    };
  },
};
</script>
