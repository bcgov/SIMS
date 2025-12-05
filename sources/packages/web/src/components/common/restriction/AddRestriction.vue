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
import { Role, VForm, SelectItemType, RestrictionType } from "@/types";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { AssignRestrictionAPIInDTO } from "@/services/http/dto";
import { RestrictionService } from "@/services/RestrictionService";

export const CATEGORY_KEY = "category";
export default defineComponent({
  components: { ModalDialogBase, CheckPermissionRole, ErrorSummary },
  props: {
    allowedRole: {
      type: String as PropType<Role>,
      required: true,
    },
  },
  setup() {
    const { checkNotesLengthRule } = useRules();
    const processing = ref(false);
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
      restrictionCategories.value = categories.map((category) => ({
        title: category.description,
        value: category.description,
      }));
    };

    onMounted(categoryItems);

    const categoryReasonItems = async () => {
      restrictionReasons.value = [];
      const reasons = await RestrictionService.shared.getRestrictionReasons(
        RestrictionType.Provincial,
        selectedCategory.value,
      );
      restrictionReasons.value = reasons.map((reason) => ({
        title: reason.description,
        value: reason.id,
      }));
    };

    const submit = async () => {
      const validationResult = await addRestrictionForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      try {
        processing.value = true;
        const modalResult = await resolvePromise(formModel);
        if (modalResult) {
          // Indicates the modal will be closed and the form can be reset.
          addRestrictionForm.value.reset();
        }
      } finally {
        processing.value = false;
      }
    };

    const cancel = () => {
      addRestrictionForm.value.reset();
      resolvePromise(false);
    };

    return {
      showDialog,
      showModal,
      processing,
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
