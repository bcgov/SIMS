<template>
  <tab-container>
    <body-header-container>
      <template #header>
        <body-header
          title="Social Insurance Number"
          sub-title="The first row will always be the student's current active SIN."
          :records-count="studentSINValidations?.length"
        >
          <template #actions>
            <check-permission-role :role="Role.StudentAddNewSIN">
              <template #="{ notAllowed }">
                <v-btn
                  class="float-right"
                  color="primary"
                  data-cy="addNewSINButton"
                  :disabled="processingNewSIN || notAllowed"
                  @click="addNewSIN"
                  prepend-icon="fa:fa fa-plus-circle"
                  >Add new SIN</v-btn
                >
              </template>
            </check-permission-role>
          </template>
        </body-header>
      </template>
      <content-group>
        <toggle-content :toggled="!studentSINValidations?.length">
          <v-data-table
            :headers="SocialInsuranceNumberHeaders"
            :items="studentSINValidations"
            :items-per-page="DEFAULT_PAGE_LIMIT"
            :items-per-page-options="ITEMS_PER_PAGE"
            :mobile="isMobile"
          >
            <template #loading>
              <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
            </template>
            <template #[`item.createdAtFormatted`]="{ item }">
              {{ item.createdAtFormatted }}
            </template>
            <template #[`item.sinFormatted`]="{ item }">
              <span class="text-nowrap">{{ item.sinFormatted }}</span>
            </template>
            <template #[`item.isValidSINFormatted`]="{ item }">
              {{ item.isValidSINFormatted }}
            </template>
            <template #[`item.sinStatus`]="{ item }">
              {{ item.sinStatus }}
            </template>
            <template #[`item.validSINCheckFormatted`]="{ item }">
              {{ item.validSINCheckFormatted }}
            </template>
            <template #[`item.validFirstNameCheckFormatted`]="{ item }">
              {{ item.validFirstNameCheckFormatted }}
            </template>
            <template #[`item.validLastNameCheckFormatted`]="{ item }">
              {{ item.validLastNameCheckFormatted }}
            </template>
            <template #[`item.validBirthdateCheckFormatted`]="{ item }">
              {{ item.validBirthdateCheckFormatted }}
            </template>
            <template #[`item.validGenderCheckFormatted`]="{ item }">
              {{ item.validGenderCheckFormatted }}
            </template>
            <template #[`item.sinExpiryDateFormatted`]="{ item }">
              {{ item.sinExpiryDateFormatted }}
            </template>
            <template #[`item.action`]="{ item }">
              <check-permission-role :role="Role.StudentAddSINExpiry">
                <template #="{ notAllowed }">
                  <v-btn
                    color="primary"
                    :disabled="
                      !item.temporarySIN ||
                      !!item.sinExpiryDate ||
                      processingEditExpiryDate ||
                      notAllowed
                    "
                    @click="addExpiryDate(item.id)"
                    >Add expiry date</v-btn
                  >
                </template>
              </check-permission-role>
            </template>
          </v-data-table>
        </toggle-content>
      </content-group>
      <add-new-s-i-n
        ref="addNewSINModal"
        :allowed-role="Role.StudentAddNewSIN"
      />
      <add-expiry-date
        ref="addExpiryDateModal"
        :allowed-role="Role.StudentAddSINExpiry"
      />
    </body-header-container>
  </tab-container>
</template>

<script lang="ts">
import { ref, watch, defineComponent } from "vue";
import { useDisplay } from "vuetify";

import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  SINValidations,
  LayoutTemplates,
  Role,
  SocialInsuranceNumberHeaders,
} from "@/types";
import { StudentService } from "@/services/StudentService";
import { useFileUtils, ModalDialog, useSnackBar } from "@/composables";
import {
  CreateSINValidationAPIInDTO,
  UpdateSINValidationAPIInDTO,
} from "@/services/http/dto";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import AddNewSIN from "@/components/common/sin/AddNewSIN.vue";
import AddExpiryDate from "@/components/common/sin/AddExpiryDate.vue";

export default defineComponent({
  components: {
    CheckPermissionRole,
    AddNewSIN,
    AddExpiryDate,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const { mobile: isMobile } = useDisplay();
    const showModal = ref(false);
    const studentSINValidations = ref([] as SINValidations[]);
    const addNewSINModal = ref(
      {} as ModalDialog<CreateSINValidationAPIInDTO | boolean>,
    );
    const addExpiryDateModal = ref(
      {} as ModalDialog<UpdateSINValidationAPIInDTO | boolean>,
    );
    const snackBar = useSnackBar();
    const fileUtils = useFileUtils();
    const initialData = ref({ studentId: props.studentId });
    const processingNewSIN = ref(false);
    const processingEditExpiryDate = ref(false);

    const loadSINValidations = async () => {
      studentSINValidations.value =
        await StudentService.shared.getStudentSINValidations(props.studentId);
    };

    watch(() => props.studentId, loadSINValidations, { immediate: true });

    const addNewSIN = async () => {
      const addNewSINData = await addNewSINModal.value.showModal();
      if (addNewSINData)
        try {
          processingNewSIN.value = true;
          await StudentService.shared.createStudentSINValidation(
            props.studentId,
            addNewSINData as CreateSINValidationAPIInDTO,
          );
          snackBar.success(
            "New SIN record created and associated to the student.",
          );
          await loadSINValidations();
        } catch {
          snackBar.error("Unexpected error while creating a new SIN record.");
        } finally {
          processingNewSIN.value = false;
        }
    };

    const addExpiryDate = async (sinValidationId: number) => {
      const addExpiryDateData = await addExpiryDateModal.value.showModal();
      if (addExpiryDateData) {
        try {
          processingEditExpiryDate.value = true;
          await StudentService.shared.updateStudentSINValidation(
            props.studentId,
            sinValidationId,
            addExpiryDateData as UpdateSINValidationAPIInDTO,
          );
          snackBar.success("Temporary SIN expiry date updated.");
          await loadSINValidations();
        } catch {
          snackBar.error("Unexpected error while updating the expiry date.");
        } finally {
          processingEditExpiryDate.value = false;
        }
      }
    };

    return {
      studentSINValidations,
      fileUtils,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      addNewSIN,
      addNewSINModal,
      addExpiryDateModal,
      initialData,
      addExpiryDate,
      processingNewSIN,
      processingEditExpiryDate,
      LayoutTemplates,
      Role,
      showModal,
      SocialInsuranceNumberHeaders,
      isMobile,
    };
  },
});
</script>
