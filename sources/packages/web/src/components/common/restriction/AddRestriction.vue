<template>
  <v-form ref="addRestrictionForm">
    <modal-dialog-base
      title="Add new restriction"
      :show-dialog="showDialog"
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
          @update:model-value="categoryReasonItems()"
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
          :rules="[checkNotesLengthRule]"
      /></template>
      <template #footer>
        <check-permission-role :role="allowedRole">
          <template #="{ notAllowed }">
            <footer-buttons
              :processing="processing"
              primary-label="Add Restriction"
              @primary-click="submit"
              @secondary-click="cancel"
              :disable-primary-button="notAllowed"
            />
          </template>
        </check-permission-role>
      </template>
    </modal-dialog-base>
  </v-form>
</template>
<script lang="ts">
import { PropType, ref, onMounted, reactive, defineComponent } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import { useModalDialog, useRules } from "@/composables";
import {
  Role,
  VForm,
  RestrictionEntityType,
  SelectItemType,
  RestrictionType,
} from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { AssignRestrictionAPIInDTO } from "@/services/http/dto";
import { RestrictionService } from "@/services/RestrictionService";

export const CATEGORY_KEY = "category";
export default defineComponent({
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
  setup(props) {
    const { checkNotesLengthRule } = useRules();
    const restrictionCategories = ref([] as SelectItemType[]);
    const restrictionReasons = ref([] as SelectItemType[]);
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
        RestrictionType.Provincial,
        selectedCategory.value,
      );
      const restrictionReasonsArray: SelectItemType[] = [];
      // Restriction category Designation is exclusively for Institution. Rest of them are for Student.
      reasons.forEach((reason) => {
        {
          restrictionReasonsArray.push({
            title: reason.description,
            value: reason.id,
          });
        }
      });
      restrictionReasons.value = restrictionReasonsArray;
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
      checkNotesLengthRule,
    };
  },
});
</script>
