<template>
  <v-form ref="addRestrictionForm">
    <!-- TODO min-width has to be confirmed  -->
    <modal-dialog-base
      title="Add new restriction"
      :showDialog="showDialog"
      max-width="730"
      min-width="730"
    >
      <template #content>
        <error-summary :errors="addRestrictionForm.errors" />
        <v-autocomplete
          label="Category"
          density="compact"
          :items="items"
          v-model="selectedCategory"
          variant="outlined"
          placeholder="Select a category"
          @update:modelValue="categoryChanged(selectedCategory)"
          :rules="[(v) => !!v || 'Category is required.']" />
        <v-autocomplete
          label="Reason"
          density="compact"
          :items="reasonItems"
          v-model="formModel.restrictionId"
          variant="outlined"
          placeholder="Select a reason"
          :rules="[(v) => !!v || 'Reason is required.']" />
        <v-textarea
          label="Notes"
          placeholder="Long text..."
          v-model="formModel.noteDescription"
          variant="outlined"
          :rules="[(v) => !!v || 'Notes is required']"
      /></template>
      <template #footer>
        <check-permission-role :role="allowedRole">
          <template #="{ notAllowed }">
            <footer-buttons
              :processing="processing"
              primaryLabel="Add Restriction"
              @primaryClick="submit"
              @secondaryClick="cancel"
              :disablePrimaryButton="notAllowed"
            />
          </template>
        </check-permission-role>
      </template>
    </modal-dialog-base>
  </v-form>
</template>
<script lang="ts">
import { PropType, ref, onMounted, reactive } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import { useModalDialog } from "@/composables";
import { Role, VForm, RestrictionEntityType } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import {
  AssignRestrictionAPIInDTO,
  AssignRestrictionCategoryOutDTO,
  AssignRestrictionReasonsOutDTO,
} from "@/services/http/dto";
import { RestrictionService } from "@/services/RestrictionService";

export const CATEGORY_KEY = "category";
export default {
  components: { ModalDialogBase, CheckPermissionRole, ErrorSummary },
  props: {
    entityType: {
      type: String,
      required: true,
    },
    allowedRole: {
      type: String as PropType<Role>,
      required: true,
    },
  },
  setup(props: any) {
    const items = ref([] as AssignRestrictionCategoryOutDTO[]);
    const reasonItems = ref([] as AssignRestrictionReasonsOutDTO[]);
    const selectedCategory = ref("");
    const { showDialog, showModal, resolvePromise } = useModalDialog<
      AssignRestrictionAPIInDTO | false
    >();
    const addRestrictionForm = ref({} as VForm);
    const formModel = reactive({} as AssignRestrictionAPIInDTO);

    const categoryItems = async () => {
      const categories =
        await RestrictionService.shared.getRestrictionCategories();
      // Restriction category Designation is exclusively for Institution. Rest of them are for Student.
      if (props.entityType === RestrictionEntityType.Student) {
        for (const category of categories) {
          items.value.push({
            title: category.description,
            value: category.description,
          });
        }
      } else {
        items.value.push({
          title: "Designation",
          value: "Designation",
        });
      }
    };

    onMounted(async () => {
      categoryItems();
    });

    const categoryChanged = (category: string) => {
      categoryReasonItems(category);
    };

    const categoryReasonItems = async (category: string) => {
      reasonItems.value = [];
      const reasons = await RestrictionService.shared.getRestrictionReasons(
        category,
      );
      // Restriction category Designation is exclusively for Institution. Rest of them are for Student.
      for (const reason of reasons) {
        reasonItems.value.push({
          title: reason.description,
          value: reason.id,
        });
      }
    };

    const submit = async () => {
      const validationResult = await addRestrictionForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      const payload = { ...formModel };
      resolvePromise(payload);
      addRestrictionForm.value.reset();
    };

    const cancel = () => {
      addRestrictionForm.value.reset();
      addRestrictionForm.value.resetValidation();
      resolvePromise(false);
    };

    return {
      showDialog,
      showModal,
      cancel,
      submit,
      Role,
      addRestrictionForm,
      formModel,
      items,
      reasonItems,
      selectedCategory,
      categoryChanged,
    };
  },
};
</script>
