<template>
  <full-page-container>
    <template #header>
      <header-navigator
        title="Accounts"
        subTitle="View request"
        :routeLocation="pendingAccountsRoute"
      >
        <template #buttons>
          <v-row class="p-0 m-0">
            <check-permission-role
              :role="Role.StudentApproveDeclineAccountRequests"
            >
              <template #="{ notAllowed }">
                <v-btn
                  color="primary"
                  class="mr-2"
                  variant="outlined"
                  @click="declineStudentAccount"
                  :disabled="notAllowed"
                  >Deny request</v-btn
                >
                <v-btn
                  color="primary"
                  @click="createStudentAccount"
                  :disabled="notAllowed"
                  >Create student account</v-btn
                >
              </template>
            </check-permission-role>
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

  <check-permission-role :role="Role.StudentApproveDeclineAccountRequests">
    <template #="{ notAllowed }">
      <confirm-modal
        title="Create student account"
        text="Attention: Approved account requests are final and cannot be deactivated. Please ensure all supporting documentation has been carefully reviewed prior to approval."
        okLabel="Create account now"
        ref="createStudentAccountModal"
        :disablePrimaryButton="notAllowed"
      ></confirm-modal>
      <confirm-modal
        title="Deny request for a student account"
        text="Denying the request means that the student will not be able to access the system using a Basic BCeID."
        ref="declineStudentAccountModal"
        okLabel="Deny request now"
        :disablePrimaryButton="notAllowed"
      ></confirm-modal>
    </template>
  </check-permission-role>
</template>

<script lang="ts">
import { ref, onMounted, defineComponent } from "vue";
import { useRouter } from "vue-router";
import {
  StudentProfileFormModel,
  StudentProfileFormModes,
} from "@/types/contracts/StudentContract";
import StudentProfileForm from "@/components/common/StudentProfileForm.vue";
import { StudentAccountApplicationService } from "@/services/StudentAccountApplicationService";
import { ApiProcessError, IdentityProviders, FormIOForm, Role } from "@/types";
import { StudentAccountApplicationApprovalAPIInDTO } from "@/services/http/dto";
import { ModalDialog, useFormioUtils, useSnackBar } from "@/composables";
import ConfirmModal from "@/components/common/modals/ConfirmModal.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

export default defineComponent({
  components: {
    StudentProfileForm,
    ConfirmModal,
    CheckPermissionRole,
  },
  props: {
    studentAccountApplicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const snackBar = useSnackBar();
    const router = useRouter();
    let formIOForm: FormIOForm<StudentAccountApplicationApprovalAPIInDTO>;
    const { checkFormioValidity, excludeExtraneousValues } = useFormioUtils();
    const initialData = ref({} as StudentProfileFormModel);
    const processing = ref(false);
    const createStudentAccountModal = ref({} as ModalDialog<boolean>);
    const declineStudentAccountModal = ref({} as ModalDialog<boolean>);

    const pendingAccountsRoute = {
      name: AESTRoutesConst.STUDENT_ACCOUNT_APPLICATIONS,
    };

    const getStudentDetails = async () => {
      const accountApplication =
        await StudentAccountApplicationService.shared.getStudentAccountApplicationById(
          props.studentAccountApplicationId,
        );
      const studentProfileFormModel =
        accountApplication.submittedData as StudentProfileFormModel;
      studentProfileFormModel.identityProvider = IdentityProviders.BCeIDBoth;
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
      if (await checkFormioValidity([formIOForm])) {
        try {
          const create = await createStudentAccountModal.value.showModal();
          if (!create) {
            return;
          }
          processing.value = true;
          const typedData = excludeExtraneousValues(
            StudentAccountApplicationApprovalAPIInDTO,
            formIOForm.data,
          );
          await StudentAccountApplicationService.shared.approveStudentAccountApplication(
            props.studentAccountApplicationId,
            typedData,
          );
          snackBar.success(
            "Student account application approved and student account created.",
          );
          router.push(pendingAccountsRoute);
        } catch (error: unknown) {
          if (error instanceof ApiProcessError) {
            snackBar.error(error.message);
          } else {
            snackBar.error(
              "Unexpected error while approving the student account application.",
            );
          }
        } finally {
          processing.value = false;
        }
      }
    };

    const declineStudentAccount = async () => {
      try {
        const decline = await declineStudentAccountModal.value.showModal();
        if (!decline) {
          return;
        }
        processing.value = true;
        await StudentAccountApplicationService.shared.declineStudentAccountApplication(
          props.studentAccountApplicationId,
        );
        snackBar.success("Student account application declined.");
        router.push(pendingAccountsRoute);
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
      createStudentAccountModal,
      declineStudentAccountModal,
      pendingAccountsRoute,
      Role,
    };
  },
});
</script>
