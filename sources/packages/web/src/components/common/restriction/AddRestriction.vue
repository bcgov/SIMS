<template>
  <v-form ref="addRestrictionForm">
    <modal-dialog-base
      title="Add new restriction"
      :showDialog="showDialog"
      min-width="730"
    >
      <template #content>
        <error-summary :errors="addRestrictionForm.errors" />
        <!-- TODO add placeholder for v-select when we have stable vuetify 3.-->
        <v-select
          class="mt-4"
          label="Category"
          density="compact"
          :items="restrictionCategories"
          v-model="selectedCategory"
          variant="outlined"
          @update:modelValue="categoryReasonItems()"
          :rules="[(v) => !!v || 'Category is required.']" />
        <v-select
          label="Reason"
          density="compact"
          :items="restrictionReasons"
          v-model="formModel.restrictionId"
          variant="outlined"
          :rules="[(v) => !!v || 'Reason is required.']" />
        <v-textarea
          label="Notes"
          placeholder="Long text..."
          v-model="formModel.noteDescription"
          variant="outlined"
          :rules="[(v) => checkNotesLength(v)]"
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
import { useModalDialog, useValidators } from "@/composables";
import { Role, VForm, RestrictionEntityType } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import {
  AssignRestrictionAPIInDTO,
  AssignRestrictionCategories,
  AssignRestrictionReasons,
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
    const NOTES_MAX_CHARACTERS = 500;
    const { checkMaxCharacters } = useValidators();
    const restrictionCategories = ref([] as AssignRestrictionCategories[]);
    const restrictionReasons = ref([] as AssignRestrictionReasons[]);
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
        categories.forEach((category) => {
          restrictionCategories.value.push({
            title: category.description,
            value: category.description,
          });
        });
      } else {
        restrictionCategories.value.push({
          title: "Designation",
          value: "Designation",
        });
      }
    };

    onMounted(categoryItems);

    const categoryReasonItems = async () => {
      restrictionReasons.value = [];
      const reasons = await RestrictionService.shared.getRestrictionReasons(
        selectedCategory.value,
      );
      // Restriction category Designation is exclusively for Institution. Rest of them are for Student.
      reasons.forEach((reason) => {
        {
          restrictionReasons.value.push({
            title: reason.description,
            value: reason.id,
          });
        }
      });
    };

    const submit = async () => {
      const validationResult = await addRestrictionForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      // Copying the payload, as reset is making the formModel properties null.
      const payload = { ...formModel };
      resolvePromise(payload);
      addRestrictionForm.value.reset();
    };

    const cancel = () => {
      addRestrictionForm.value.reset();
      addRestrictionForm.value.resetValidation();
      resolvePromise(false);
    };

    const checkNotesLength = (notes: string) => {
      if (notes) {
        return (
          checkMaxCharacters(notes, NOTES_MAX_CHARACTERS) ||
          `Max ${NOTES_MAX_CHARACTERS} characters.`
        );
      }
      return "Note body is required.";
    };

    return {
      showDialog,
      showModal,
      cancel,
      submit,
      Role,
      addRestrictionForm,
      formModel,
      restrictionCategories,
      restrictionReasons,
      selectedCategory,
      categoryReasonItems,
      checkNotesLength,
    };
  },
};
</script>
