<template>
  <student-page-container>
    <template #header>
      <header-navigator v-if="editMode" title="Student" subTitle="Profile" />
    </template>
    <formio
      formName="studentinformation"
      :data="initialData"
      @submitted="submitted"
      @customEvent="showPDApplicationModal"
    ></formio>
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
    const { dateOnlyLongString } = useFormatters();
    const studentStore = useStudentStore();
    const pdStatusApplicationModal = ref({} as ModalDialog<boolean>);

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
        };
        initialData.value = data;
      } else {
        const data = {} as StudentFormData;
        initialData.value = {
          ...data,
          firstName: bcscParsedToken.givenNames,
          lastName: bcscParsedToken.lastName,
          email: bcscParsedToken.email,
          gender: bcscParsedToken.gender,
          dateOfBirth: dateOnlyLongString(bcscParsedToken.birthdate),
          mode: FormModes.create,
        };
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
      formData: UpdateStudentAPIInDTO | CreateStudentAPIInDTO,
    ) => {
      try {
        if (props.editMode) {
          await StudentService.shared.updateStudent(formData);

          snackBar.success("Student contact information updated!");
        } else {
          await StudentService.shared.createStudent(
            formData as CreateStudentAPIInDTO,
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
    };
  },
};
</script>
