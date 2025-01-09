<template>
  <full-page-container v-if="applicationDetail.data" class="my-2">
    <template #header>
      <header-navigator
        title="Back to student applications"
        :routeLocation="{
          name: AESTRoutesConst.STUDENT_APPLICATIONS,
          params: { studentId },
        }"
        subTitle="Financial Aid Application"
      >
      </header-navigator>
    </template>
    <h2 class="color-blue pb-4">
      Student Application Details
      {{ emptyStringFiller(applicationDetail.applicationNumber) }}
    </h2>
    <StudentApplication
      @render="formRender"
      :selectedForm="selectedForm"
      :initialData="initialData"
      :programYearId="applicationDetail.applicationProgramYearID"
      :isReadOnly="true"
    />
  </full-page-container>
  <router-view />
</template>
<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import {
  ApplicationDataChangeAPIOutDTO,
  ApplicationSupplementalDataAPIOutDTO,
} from "@/services/http/dto";
import { ApplicationService } from "@/services/ApplicationService";
import { useFormatters } from "@/composables/useFormatters";
import StudentApplication from "@/components/common/StudentApplication.vue";
import { useFormioUtils } from "@/composables";
import { FormIOComponent, FormIOForm, FromIOComponentTypes } from "@/types";

export default defineComponent({
  components: {
    StudentApplication,
  },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const { emptyStringFiller } = useFormatters();
    const { searchByKey } = useFormioUtils();
    const applicationDetail = ref({} as ApplicationSupplementalDataAPIOutDTO);
    const initialData = ref({});
    const selectedForm = ref();
    let applicationWizard: FormIOForm;
    /**
     * Happens when all the form components are rendered, including lists.
     */
    const formRender = async (form: FormIOForm) => {
      applicationWizard = form;
      // Highlight changes in the form after all the components are rendered.
      // List components are ready only after the form is rendered.
      highlightChanges();
    };
    /**
     * Loads the initial application data.
     */
    onMounted(async () => {
      const application = await ApplicationService.shared.getApplicationDetail(
        props.applicationId,
      );
      applicationDetail.value =
        application as ApplicationSupplementalDataAPIOutDTO;
      selectedForm.value = applicationDetail.value.applicationFormName;
      initialData.value = {
        ...applicationDetail.value.data,
        isReadOnly: true,
      };
      highlightChanges();
    });
    /**
     * Check if the application has changes to be highlighted.
     * Changes are expected after applications are edited after submitted at least once.
     */
    function highlightChanges() {
      if (!applicationWizard || !applicationDetail.value.changes.length) {
        return;
      }
      highlightChangesRecursive(
        applicationWizard,
        applicationDetail.value.changes,
      );
    }
    /**
     * Apply the style class to the components that have changes.
     * @param parentComponent component to have the changes highlighted.
     * @param changes list of changes to be highlighted.
     */
    function highlightChangesRecursive(
      parentComponent: FormIOComponent,
      changes: ApplicationDataChangeAPIOutDTO[],
    ) {
      for (const change of changes) {
        let searchComponent: FormIOComponent | undefined;
        if (typeof change.index === "number") {
          searchComponent = parentComponent.components[change.index];
          highlightChangesRecursive(searchComponent, change.changes);
        } else if (change.key) {
          searchComponent = parentComponent;
        }
        if (
          !change.key ||
          !searchComponent ||
          !searchComponent.components?.length
        ) {
          continue;
        }
        const [component] = searchByKey(searchComponent.components, change.key);
        if (component) {
          applyChangedValueStyleClass(component, change.itemsRemoved);
          highlightChangesRecursive(component, change.changes);
        }
      }
    }

    /**
     * Apply the proper highlight style to a changed component.
     * @param component component to received the style.
     * @param itemRemoved indicates if the component had an item removed,
     * which would required a different style to be applied.
     */
    function applyChangedValueStyleClass(
      component: FormIOComponent,
      itemRemoved?: boolean,
    ) {
      if (
        component.type === FromIOComponentTypes.Hidden ||
        component._visible === false
      ) {
        return;
      }
      const cssClass = itemRemoved ? "changed-list-length" : "changed-value";
      document.getElementById(component.id)?.classList.add(cssClass);
    }

    return {
      formRender,
      applicationDetail,
      initialData,
      selectedForm,
      AESTRoutesConst,
      emptyStringFiller,
    };
  },
});
</script>
